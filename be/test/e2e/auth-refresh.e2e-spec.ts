import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser } from '../helpers/test-auth.helper';

describe('POST /api/v1/auth/refresh', () => {
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

  it('should refresh tokens successfully', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: user.refreshToken })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(typeof res.body.access_token).toBe('string');
    expect(typeof res.body.refresh_token).toBe('string');
    expect(res.body.access_token.length).toBeGreaterThan(0);
    expect(res.body.refresh_token.length).toBeGreaterThan(0);

    const { user: userData } = res.body;
    expect(userData).toHaveProperty('id');
    expect(userData).toHaveProperty('email');
  });

  it('should invalidate old refresh token after rotation', async () => {
    const user = await registerTestUser(app);
    const oldRefreshToken = user.refreshToken;

    // First refresh — should succeed and rotate the token
    await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: oldRefreshToken })
      .expect(201);

    // Second use of old token — should fail
    const res = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: oldRefreshToken })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 for an invalid token string', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'completely-invalid-token' })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 400 VALIDATION_ERROR for missing refresh_token', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({})
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return a new access_token that works for authenticated endpoints', async () => {
    const user = await registerTestUser(app);

    const refreshRes = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: user.refreshToken })
      .expect(201);

    const newAccessToken = refreshRes.body.access_token;

    // Use the new access token to hit an authenticated endpoint
    await apiRequest(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);
  });

  it('should reject replay attack — same refresh_token used twice', async () => {
    const user = await registerTestUser(app);
    const originalRefreshToken = user.refreshToken;

    // First use — succeeds
    const firstRes = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: originalRefreshToken })
      .expect(201);

    expect(firstRes.body).toHaveProperty('refresh_token');

    // Second use of the SAME original token — should fail (token was rotated)
    const secondRes = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: originalRefreshToken })
      .expect(401);

    expect(secondRes.body.error_code).toBe('UNAUTHORIZED');
  });
});
