import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser } from '../helpers/test-auth.helper';

describe('POST /api/v1/auth/login', () => {
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

  const email = 'login-test@example.com';
  const password = 'StrongPass1';

  it('should login an existing user and return tokens + user data', async () => {
    await registerTestUser(app, { email, password });

    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(typeof res.body.access_token).toBe('string');
    expect(typeof res.body.refresh_token).toBe('string');
    expect(res.body.access_token.length).toBeGreaterThan(0);
    expect(res.body.refresh_token.length).toBeGreaterThan(0);

    const { user } = res.body;
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(email);
    expect(user).toHaveProperty('timezone');
    expect(user).toHaveProperty('onboardingCompleted');
    expect(user).toHaveProperty('createdAt');
  });

  it('should return 401 for wrong password', async () => {
    await registerTestUser(app, { email, password });

    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass999' })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 for non-existent user', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'StrongPass1' })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should handle case-insensitive email (lowercased on registration)', async () => {
    await registerTestUser(app, { email: 'TEST@test.com', password });

    // The app lowercases email on registration, so login with lowercase should work
    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body.user.email).toBe('test@test.com');
  });

  it('should return 400 VALIDATION_ERROR for missing fields', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return tokens that are non-empty JWT strings', async () => {
    await registerTestUser(app, { email, password });

    const res = await apiRequest(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    // JWTs have 3 dot-separated segments
    expect(res.body.access_token.split('.').length).toBe(3);
    // Refresh token is a hex string, not a JWT — just verify it's non-empty
    expect(res.body.refresh_token.length).toBeGreaterThan(0);
  });
});
