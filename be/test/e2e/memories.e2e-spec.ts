import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Memories E2E', () => {
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

  describe('GET /api/v1/memories/on-this-day', () => {
    it('should return 403 FEATURE_LOCKED for FREE tier', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/memories/on-this-day'),
        user,
      ).expect(403);

      expect(res.body.error_code).toBe('FEATURE_LOCKED');
      expect(res.body.details.feature).toBe('memories');
    });

    it('should return 403 FEATURE_LOCKED for PRO tier (memories requires PREMIUM)', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PRO');

      const res = await auth(
        apiRequest(app).get('/api/v1/memories/on-this-day'),
        user,
      ).expect(403);

      expect(res.body.error_code).toBe('FEATURE_LOCKED');
      expect(res.body.details.feature).toBe('memories');
    });

    it('should return 200 with memories for PREMIUM tier', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PREMIUM');

      const res = await auth(
        apiRequest(app).get('/api/v1/memories/on-this-day'),
        user,
      ).expect(200);

      expect(res.body).toHaveProperty('baseDate');
      expect(res.body).toHaveProperty('memories');
      expect(Array.isArray(res.body.memories)).toBe(true);
    });
  });

  describe('GET /api/v1/memories/context', () => {
    it('should return 200 for day mode with PREMIUM tier', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PREMIUM');

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/memories/context')
          .query({ mode: 'day', date: '2024-06-15' }),
        user,
      ).expect(200);

      expect(res.body).toBeDefined();
    });

    it('should return 200 for week mode with PREMIUM tier', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PREMIUM');

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/memories/context')
          .query({ mode: 'week', date: '2024-06-15' }),
        user,
      ).expect(200);

      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app)
        .get('/api/v1/memories/context')
        .query({ mode: 'day', date: '2024-06-15' })
        .expect(401);
    });
  });
});
