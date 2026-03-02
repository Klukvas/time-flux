import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';

describe('POST /api/v1/auth/register', () => {
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

  const validPayload = {
    email: 'test@example.com',
    password: 'StrongPass1',
  };

  it('should register a new user and return tokens + user data', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send(validPayload)
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(typeof res.body.access_token).toBe('string');
    expect(typeof res.body.refresh_token).toBe('string');
    expect(res.body.access_token.length).toBeGreaterThan(0);
    expect(res.body.refresh_token.length).toBeGreaterThan(0);

    const { user } = res.body;
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
    expect(user.timezone).toBe('UTC');
    expect(user.onboardingCompleted).toBe(false);
    expect(user).toHaveProperty('tier');
    expect(user).toHaveProperty('createdAt');
  });

  it('should return 400 VALIDATION_ERROR for duplicate email', async () => {
    await apiRequest(app)
      .post('/api/v1/auth/register')
      .send(validPayload)
      .expect(201);

    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send(validPayload)
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for password without uppercase', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@test.com', password: 'weakpass1' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for password without digit', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@test.com', password: 'WeakPassword' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for invalid email', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'StrongPass1' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for missing fields (empty body)', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for extra fields (forbidNonWhitelisted)', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, foo: 'bar' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should default timezone to UTC when not provided', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send(validPayload)
      .expect(201);

    expect(res.body.user.timezone).toBe('UTC');
  });

  it('should accept and return a custom timezone', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, timezone: 'America/New_York' })
      .expect(201);

    expect(res.body.user.timezone).toBe('America/New_York');
  });
});
