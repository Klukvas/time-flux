import { randomUUID } from 'crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

export interface TestUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

/** Register a unique test user and return tokens + user info. */
export async function registerTestUser(
  app: INestApplication,
  overrides?: { email?: string; password?: string; timezone?: string },
): Promise<TestUser> {
  const email =
    overrides?.email ?? `e2e-${randomUUID().slice(0, 8)}@test.com`;
  const password = overrides?.password ?? 'TestPass123';

  const res = await request(app.getHttpServer() as App)
    .post('/api/v1/auth/register')
    .send({
      email,
      password,
      ...(overrides?.timezone ? { timezone: overrides.timezone } : {}),
    })
    .expect(201);

  return {
    accessToken: res.body.access_token,
    refreshToken: res.body.refresh_token,
    userId: res.body.user.id,
    email,
  };
}

/** Login an existing user and return tokens. */
export async function loginTestUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<TestUser> {
  const res = await request(app.getHttpServer() as App)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    accessToken: res.body.access_token,
    refreshToken: res.body.refresh_token,
    userId: res.body.user.id,
    email,
  };
}
