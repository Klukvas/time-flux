import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser } from '../helpers/test-auth.helper';

describe('PATCH /api/v1/auth/onboarding', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  it('should mark onboarding as completed', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(user.email);
    expect(res.body.onboardingCompleted).toBe(true);
    expect(res.body).toHaveProperty('tier');
    expect(res.body).toHaveProperty('timezone');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('should be idempotent — calling twice still returns onboardingCompleted true', async () => {
    const user = await registerTestUser(app);

    // First call
    await apiRequest(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    // Second call
    const res = await apiRequest(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body.onboardingCompleted).toBe(true);
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await apiRequest(app)
      .patch('/api/v1/auth/onboarding')
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
