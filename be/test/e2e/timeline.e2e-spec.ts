import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Timeline E2E', () => {
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

  /** Create a category, event group, and period for a user. */
  async function createCategoryGroupPeriod(
    user: TestUser,
    startDate: string,
    endDate?: string,
  ) {
    const catRes = await auth(apiRequest(app).post('/api/v1/categories'), user)
      .send({ name: 'Work', color: '#FF5733' })
      .expect(201);

    const groupRes = await auth(
      apiRequest(app).post('/api/v1/event-groups'),
      user,
    )
      .send({ categoryId: catRes.body.id, title: 'Job at Acme' })
      .expect(201);

    const periodRes = await auth(
      apiRequest(app).post(`/api/v1/event-groups/${groupRes.body.id}/periods`),
      user,
    )
      .send({ startDate, ...(endDate ? { endDate } : {}) })
      .expect(201);

    return {
      category: catRes.body,
      group: groupRes.body,
      period: periodRes.body,
    };
  }

  /** Create a day state and upsert a day for the given date. */
  async function createDayWithState(user: TestUser, date: string) {
    const stateRes = await auth(
      apiRequest(app).post('/api/v1/day-states'),
      user,
    )
      .send({ name: 'Great', color: '#4CAF50', score: 9 })
      .expect(201);

    const dayRes = await auth(apiRequest(app).put(`/api/v1/days/${date}`), user)
      .send({ dayStateId: stateRes.body.id })
      .expect(200);

    return { dayState: stateRes.body, day: dayRes.body };
  }

  describe('GET /api/v1/timeline', () => {
    it('should return default range with periods and days arrays', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/timeline'),
        user,
      ).expect(200);

      expect(res.body).toHaveProperty('from');
      expect(res.body).toHaveProperty('to');
      expect(Array.isArray(res.body.periods)).toBe(true);
      expect(Array.isArray(res.body.days)).toBe(true);
    });

    it('should respect custom date range', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline')
          .query({ from: '2024-01-01', to: '2024-06-30' }),
        user,
      ).expect(200);

      expect(res.body.from).toBe('2024-01-01');
      expect(res.body.to).toBe('2024-06-30');
    });

    it('should include periods in response', async () => {
      const user = await registerTestUser(app);
      await createCategoryGroupPeriod(user, '2024-03-01', '2024-05-01');

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline')
          .query({ from: '2024-01-01', to: '2024-12-31' }),
        user,
      ).expect(200);

      expect(res.body.periods.length).toBeGreaterThanOrEqual(1);
      expect(res.body.periods[0]).toHaveProperty('id');
      expect(res.body.periods[0]).toHaveProperty('startDate');
      expect(res.body.periods[0]).toHaveProperty('eventGroup');
    });

    it('should include day states in response', async () => {
      const user = await registerTestUser(app);
      await createDayWithState(user, '2024-06-15');

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline')
          .query({ from: '2024-06-01', to: '2024-06-30' }),
        user,
      ).expect(200);

      expect(res.body.days.length).toBeGreaterThanOrEqual(1);
      const day = res.body.days.find((d: any) => d.date === '2024-06-15');
      expect(day).toBeDefined();
      expect(day.dayState).toBeDefined();
    });

    it('should return 400 for invalid range (from > to)', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline')
          .query({ from: '2024-12-01', to: '2024-01-01' }),
        user,
      ).expect(400);

      expect(res.body.error_code).toBe('INVALID_DATE_RANGE');
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app).get('/api/v1/timeline').expect(401);
    });
  });

  describe('GET /api/v1/timeline/week', () => {
    it('should return week view with weekStart and weekEnd', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline/week')
          .query({ date: '2024-06-15' }),
        user,
      ).expect(200);

      expect(res.body).toHaveProperty('weekStart');
      expect(res.body).toHaveProperty('weekEnd');
      expect(Array.isArray(res.body.periods)).toBe(true);
      expect(Array.isArray(res.body.days)).toBe(true);
      expect(res.body.days).toHaveLength(7);
    });

    it('should include periods within the week', async () => {
      const user = await registerTestUser(app);
      // 2024-06-10 is Monday, 2024-06-16 is Sunday
      await createCategoryGroupPeriod(user, '2024-06-12', '2024-06-14');

      const res = await auth(
        apiRequest(app)
          .get('/api/v1/timeline/week')
          .query({ date: '2024-06-13' }),
        user,
      ).expect(200);

      expect(res.body.periods.length).toBeGreaterThanOrEqual(1);
    });
  });
});
