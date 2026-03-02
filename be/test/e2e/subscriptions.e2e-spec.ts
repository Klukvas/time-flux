import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Subscriptions E2E', () => {
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

  const auth = (r: request.Test, user: TestUser) =>
    r.set('Authorization', `Bearer ${user.accessToken}`);

  describe('GET /api/v1/subscriptions', () => {
    it('should return FREE subscription for a new user', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(res.body.tier).toBe('FREE');
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body).toHaveProperty('limits');
      expect(res.body).toHaveProperty('usage');
      expect(res.body.limits).toHaveProperty('media');
      expect(res.body.limits).toHaveProperty('chapters');
      expect(res.body.limits).toHaveProperty('categories');
      expect(res.body.limits).toHaveProperty('dayStates');
    });

    it('should reflect usage counts after creating resources', async () => {
      const user = await registerTestUser(app);

      // Create a category
      await auth(apiRequest(app).post('/api/v1/categories'), user)
        .send({ name: 'Work', color: '#FF5733' })
        .expect(201);

      // Create a day state
      await auth(apiRequest(app).post('/api/v1/day-states'), user)
        .send({ name: 'Great', color: '#4CAF50', score: 9 })
        .expect(201);

      const res = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(res.body.usage.categories).toBe(1);
      expect(res.body.usage.dayStates).toBe(1);
    });

    it('should return PRO subscription after tier upgrade', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PRO');

      const res = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(res.body.tier).toBe('PRO');
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app).get('/api/v1/subscriptions').expect(401);
    });
  });

  describe('POST /api/v1/subscriptions/cancel', () => {
    it('should return 404 SUBSCRIPTION_NOT_FOUND when no paddle subscription exists', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post('/api/v1/subscriptions/cancel'),
        user,
      ).expect(404);

      expect(res.body.error_code).toBe('SUBSCRIPTION_NOT_FOUND');
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app).post('/api/v1/subscriptions/cancel').expect(401);
    });
  });
});
