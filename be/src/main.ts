import './instrument.js';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { buildSwaggerConfig } from './common/swagger/swagger.config.js';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { validateEnv } from './common/config/env.schema.js';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // ── Graceful shutdown ──────────────────────────────────────
  app.enableShutdownHooks();

  // ── Compression (before all other middleware) ─────────────────
  app.use(compression());

  // ── Security: CORS whitelist ───────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl
    ? [frontendUrl]
    : ['http://localhost:3001', 'http://localhost:8081'];

  // ── Security: Helmet (must come before CORS) ──────────────────
  const connectSrc: string[] = ["'self'", ...allowedOrigins];
  const s3Endpoint = process.env.S3_ENDPOINT;
  if (s3Endpoint) connectSrc.push(s3Endpoint);

  app.use(
    helmet({
      frameguard: { action: 'deny' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc,
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400,
  });

  // ── Security: Request body size limits ─────────────────────────
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // ── Validation ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger (disabled in production) ───────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = buildSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}
bootstrap();
