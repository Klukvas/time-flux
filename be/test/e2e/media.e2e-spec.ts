import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Media E2E', () => {
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

  const TODAY = new Date().toISOString().split('T')[0];

  function validMediaDto(userId: string) {
    return {
      s3Key: `uploads/${userId}/mock-photo-${Date.now()}.jpg`,
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      size: 102400,
    };
  }

  /** Ensure a day record exists for the given date. */
  async function ensureDay(user: TestUser, date: string) {
    await auth(apiRequest(app).put(`/api/v1/days/${date}`), user)
      .send({})
      .expect(200);
  }

  describe('POST /api/v1/days/:date/media', () => {
    it('should add media and return the created record', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      const res = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.s3Key).toBe(dto.s3Key);
      expect(res.body).toHaveProperty('url');
      expect(res.body.fileName).toBe('photo.jpg');
      expect(res.body.contentType).toBe('image/jpeg');
      expect(res.body.size).toBe(102400);
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should return 400 FUTURE_DATE for a far-future date', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      const res = await auth(
        apiRequest(app).post('/api/v1/days/2099-01-01/media'),
        user,
      )
        .send(dto)
        .expect(400);

      expect(res.body.error_code).toBe('FUTURE_DATE');
    });

    it('should return 400 VALIDATION_ERROR for invalid content type', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send({
          s3Key: `uploads/${user.userId}/file.pdf`,
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          size: 1024,
        })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app)
        .post(`/api/v1/days/${TODAY}/media`)
        .send({
          s3Key: 'uploads/fake/photo.jpg',
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/days/:date/media', () => {
    it('should list media for a given date', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      await auth(apiRequest(app).post(`/api/v1/days/${TODAY}/media`), user)
        .send(dto)
        .expect(201);

      const res = await auth(
        apiRequest(app).get(`/api/v1/days/${TODAY}/media`),
        user,
      ).expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('s3Key');
    });
  });

  describe('DELETE /api/v1/media/:id', () => {
    it('should delete media and return 204', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      const createRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      await auth(
        apiRequest(app).delete(`/api/v1/media/${createRes.body.id}`),
        user,
      ).expect(204);
    });

    it('should return 404 MEDIA_NOT_FOUND for a random UUID', async () => {
      const user = await registerTestUser(app);
      const randomId = '00000000-0000-4000-a000-000000000000';

      const res = await auth(
        apiRequest(app).delete(`/api/v1/media/${randomId}`),
        user,
      ).expect(404);

      expect(res.body.error_code).toBe('MEDIA_NOT_FOUND');
    });
  });

  describe('auto-set cover (mainMediaId)', () => {
    it('should set the first image as mainMediaId for the day', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      // Fetch the day to verify mainMediaId
      const dayRes = await auth(
        apiRequest(app).get('/api/v1/days').query({ from: TODAY, to: TODAY }),
        user,
      ).expect(200);

      expect(dayRes.body.length).toBeGreaterThanOrEqual(1);
      const day = dayRes.body.find((d: any) => d.date === TODAY);
      expect(day).toBeDefined();
      expect(day.mainMediaId).toBe(mediaRes.body.id);
    });
  });

  describe('tier usage tracking', () => {
    it('should track media usage in subscription', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      await auth(apiRequest(app).post(`/api/v1/days/${TODAY}/media`), user)
        .send(dto)
        .expect(201);

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(subRes.body.usage.media).toBe(1);
    });
  });
});
