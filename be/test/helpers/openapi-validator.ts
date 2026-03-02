import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import request from 'supertest';
import type { App } from 'supertest/types';
import OpenAPIResponseValidator from 'openapi-response-validator';

let openApiDocument: OpenAPIObject | null = null;

export function setOpenApiDocument(doc: OpenAPIObject): void {
  openApiDocument = doc;
}

export function getOpenApiDocument(): OpenAPIObject | null {
  return openApiDocument;
}

/**
 * Match a concrete URL path to an OpenAPI path template.
 * E.g., '/api/v1/event-groups/abc-123' matches '/api/v1/event-groups/{id}'
 */
function matchPath(
  concretePath: string,
  specPaths: string[],
): string | null {
  if (specPaths.includes(concretePath)) return concretePath;

  const concreteSegments = concretePath.split('/');
  for (const specPath of specPaths) {
    const specSegments = specPath.split('/');
    if (specSegments.length !== concreteSegments.length) continue;

    let isMatch = true;
    for (let i = 0; i < specSegments.length; i++) {
      const seg = specSegments[i];
      if (seg.startsWith('{') && seg.endsWith('}')) continue;
      if (seg !== concreteSegments[i]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) return specPath;
  }

  return null;
}

function validateAgainstSpec(
  method: string,
  url: string,
  statusCode: number,
  body: unknown,
): Error | null {
  if (!openApiDocument) return null;

  // Skip validation for non-2xx or 204 No Content
  if (statusCode < 200 || statusCode >= 300 || statusCode === 204) return null;

  const specPaths = Object.keys(openApiDocument.paths ?? {});
  const urlPath = url.split('?')[0];
  const matchedPath = matchPath(urlPath, specPaths);
  if (!matchedPath) return null;

  const pathItem = (openApiDocument.paths as Record<string, any>)[matchedPath];
  const operation = pathItem?.[method.toLowerCase()];
  if (!operation?.responses) return null;

  const responseSpec =
    operation.responses[String(statusCode)] ??
    operation.responses['default'];
  if (!responseSpec) return null;

  // Extract schema from OpenAPI 3.0 response content
  const content = responseSpec.content?.['application/json'];
  if (!content?.schema) return null;

  const validator = new OpenAPIResponseValidator({
    responses: {
      [String(statusCode)]: { schema: content.schema },
    },
    components: openApiDocument.components as any,
  });

  const result = validator.validateResponse(String(statusCode), body);
  if (result?.errors?.length) {
    const details = result.errors
      .map((e: any) => `  - ${e.path ?? '/'}: ${e.message}`)
      .join('\n');
    return new Error(
      `OpenAPI contract violation: ${method.toUpperCase()} ${url} [${statusCode}]\n` +
        `Schema errors:\n${details}\n` +
        `Actual body: ${JSON.stringify(body, null, 2).slice(0, 500)}`,
    );
  }

  return null;
}

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
];

/**
 * Drop-in replacement for `request(app.getHttpServer())`.
 *
 * Every 2xx response is automatically validated against the OpenAPI spec.
 * Validation is skipped for: 204 No Content, 4xx/5xx, paths without schemas.
 */
export function apiRequest(app: INestApplication): request.Agent {
  const server = app.getHttpServer() as App;
  const agent = request(server);

  return new Proxy(agent, {
    get(target: any, prop: string | symbol, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (
        typeof prop === 'string' &&
        HTTP_METHODS.includes(prop) &&
        typeof value === 'function'
      ) {
        return (url: string) => {
          const test: request.Test = value.call(target, url);
          return wrapTestWithValidation(test, prop, url);
        };
      }

      return value;
    },
  }) as request.Agent;
}

function wrapTestWithValidation(
  test: request.Test,
  method: string,
  url: string,
): request.Test {
  const origThen = test.then;

  test.then = function (onfulfilled?: any, onrejected?: any) {
    return origThen.call(
      this,
      (res: request.Response) => {
        const error = validateAgainstSpec(method, url, res.status, res.body);
        if (error) throw error;
        return onfulfilled ? onfulfilled(res) : res;
      },
      onrejected,
    );
  } as any;

  return test;
}
