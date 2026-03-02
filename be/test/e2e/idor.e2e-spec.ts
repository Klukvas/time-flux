import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('IDOR Prevention E2E', () => {
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

  let userA: TestUser;
  let userB: TestUser;

  beforeEach(async () => {
    userA = await registerTestUser(app);
    userB = await registerTestUser(app);
  });

  describe('category IDOR', () => {
    it('should return 404 when userB tries to PATCH userA category', async () => {
      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        userA,
      )
        .send({ name: 'Private Cat', color: '#FF0000' })
        .expect(201);

      const res = await auth(
        apiRequest(app).patch(`/api/v1/categories/${catRes.body.id}`),
        userB,
      )
        .send({ name: 'Hacked' })
        .expect(404);

      expect(res.body.error_code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('dayState IDOR', () => {
    it('should return 404 when userB tries to PATCH userA day state', async () => {
      const stateRes = await auth(
        apiRequest(app).post('/api/v1/day-states'),
        userA,
      )
        .send({ name: 'Happy', color: '#00FF00', score: 8 })
        .expect(201);

      const res = await auth(
        apiRequest(app).patch(`/api/v1/day-states/${stateRes.body.id}`),
        userB,
      )
        .send({ name: 'Hacked' })
        .expect(404);

      expect(res.body.error_code).toBe('DAY_STATE_NOT_FOUND');
    });
  });

  describe('eventGroup IDOR', () => {
    it('should return 404 when userB tries to GET userA event group', async () => {
      // userA creates category + event group
      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        userA,
      )
        .send({ name: 'Work', color: '#FF5733' })
        .expect(201);

      const groupRes = await auth(
        apiRequest(app).post('/api/v1/event-groups'),
        userA,
      )
        .send({ categoryId: catRes.body.id, title: 'My Job' })
        .expect(201);

      // userB tries to access it
      const res = await auth(
        apiRequest(app).get(`/api/v1/event-groups/${groupRes.body.id}`),
        userB,
      ).expect(404);

      expect(res.body.error_code).toBe('EVENT_GROUP_NOT_FOUND');
    });
  });

  describe('eventPeriod IDOR', () => {
    it('should return 404 when userB tries to DELETE userA period', async () => {
      // userA creates category + group + period
      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        userA,
      )
        .send({ name: 'Work', color: '#FF5733' })
        .expect(201);

      const groupRes = await auth(
        apiRequest(app).post('/api/v1/event-groups'),
        userA,
      )
        .send({ categoryId: catRes.body.id, title: 'Acme Corp' })
        .expect(201);

      const periodRes = await auth(
        apiRequest(app).post(
          `/api/v1/event-groups/${groupRes.body.id}/periods`,
        ),
        userA,
      )
        .send({ startDate: '2024-01-01', endDate: '2024-06-01' })
        .expect(201);

      // userB tries to delete it
      const res = await auth(
        apiRequest(app).delete(`/api/v1/periods/${periodRes.body.id}`),
        userB,
      ).expect(404);

      expect(res.body.error_code).toBe('EVENT_PERIOD_NOT_FOUND');
    });
  });

  describe('day IDOR', () => {
    it('should return empty array when userB queries userA day range', async () => {
      // userA upserts a day
      await auth(apiRequest(app).put('/api/v1/days/2024-06-15'), userA)
        .send({})
        .expect(200);

      // userB queries the same range — should only see their own days
      const res = await auth(
        apiRequest(app)
          .get('/api/v1/days')
          .query({ from: '2024-06-15', to: '2024-06-15' }),
        userB,
      ).expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('media IDOR', () => {
    it('should return 404 when userB tries to DELETE userA media', async () => {
      const TODAY = new Date().toISOString().split('T')[0];

      // userA adds media
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        userA,
      )
        .send({
          s3Key: `uploads/${userA.userId}/photo.jpg`,
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
        .expect(201);

      // userB tries to delete it
      const res = await auth(
        apiRequest(app).delete(`/api/v1/media/${mediaRes.body.id}`),
        userB,
      ).expect(404);

      expect(res.body.error_code).toBe('MEDIA_NOT_FOUND');
    });
  });

  describe('subscription IDOR', () => {
    it('should return only own subscription data', async () => {
      const resA = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        userA,
      ).expect(200);

      const resB = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        userB,
      ).expect(200);

      // Both should have FREE tier but distinct records
      expect(resA.body.tier).toBe('FREE');
      expect(resB.body.tier).toBe('FREE');
      expect(resA.body.userId).toBe(userA.userId);
      expect(resB.body.userId).toBe(userB.userId);
    });
  });
});
