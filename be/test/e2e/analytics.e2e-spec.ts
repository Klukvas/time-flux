import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Analytics E2E', () => {
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

  describe('GET /api/v1/analytics/mood-overview', () => {
    it('should return 200 with basic data for FREE tier', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/analytics/mood-overview'),
        user,
      ).expect(200);

      expect(res.body.averageMoodScore).toBeDefined();
      expect(Array.isArray(res.body.moodDistribution)).toBe(true);
      expect(res.body.bestCategory).toBeNull();
      expect(res.body.worstCategory).toBeNull();
      expect(res.body.trendLast30Days).toEqual([]);
      expect(res.body.weekdayInsights).toBeNull();
    });

    it('should return 200 for PRO tier', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PRO');

      await auth(
        apiRequest(app).get('/api/v1/analytics/mood-overview'),
        user,
      ).expect(200);
    });

    it('should return 200 for PREMIUM tier', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PREMIUM');

      await auth(
        apiRequest(app).get('/api/v1/analytics/mood-overview'),
        user,
      ).expect(200);
    });

    it('should reflect mood data when days with states exist', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PRO');

      // Create a day state and upsert a day
      const stateRes = await auth(
        apiRequest(app).post('/api/v1/day-states'),
        user,
      )
        .send({ name: 'Great', color: '#4CAF50', score: 9 })
        .expect(201);

      await auth(apiRequest(app).put('/api/v1/days/2024-06-15'), user)
        .send({ dayStateId: stateRes.body.id })
        .expect(200);

      const res = await auth(
        apiRequest(app).get('/api/v1/analytics/mood-overview'),
        user,
      ).expect(200);

      expect(res.body.totalDaysWithMood).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app).get('/api/v1/analytics/mood-overview').expect(401);
    });
  });
});
