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
      expect(res.body.periodId).toBeNull();
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

  describe('PATCH /api/v1/media/:id (period association)', () => {
    /** Helper: create category + event group + period, return period ID. */
    async function createPeriodForUser(
      user: TestUser,
      startDate: string,
      endDate?: string,
    ) {
      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        user,
      )
        .send({ name: 'Test', color: '#FF0000' })
        .expect(201);

      const groupRes = await auth(
        apiRequest(app).post('/api/v1/event-groups'),
        user,
      )
        .send({ categoryId: catRes.body.id, title: 'Test Chapter' })
        .expect(201);

      const periodRes = await auth(
        apiRequest(app).post(
          `/api/v1/event-groups/${groupRes.body.id}/periods`,
        ),
        user,
      )
        .send({ startDate, ...(endDate ? { endDate } : {}) })
        .expect(201);

      const period = periodRes.body.periods[0];
      return { groupId: groupRes.body.id, periodId: period.id };
    }

    it('should update media period association', async () => {
      const user = await registerTestUser(app);
      const { periodId } = await createPeriodForUser(
        user,
        '2024-01-01',
        '2099-12-31',
      );

      const dto = validMediaDto(user.userId);
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      // Initially no period
      expect(mediaRes.body.periodId).toBeNull();

      // Set period
      const patchRes = await auth(
        apiRequest(app).patch(`/api/v1/media/${mediaRes.body.id}`),
        user,
      )
        .send({ periodId })
        .expect(200);

      expect(patchRes.body.periodId).toBe(periodId);
    });

    it('should untag media by setting periodId to null', async () => {
      const user = await registerTestUser(app);
      const { periodId } = await createPeriodForUser(
        user,
        '2024-01-01',
        '2099-12-31',
      );

      const dto = { ...validMediaDto(user.userId), periodId };
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      expect(mediaRes.body.periodId).toBe(periodId);

      // Untag
      const patchRes = await auth(
        apiRequest(app).patch(`/api/v1/media/${mediaRes.body.id}`),
        user,
      )
        .send({ periodId: null })
        .expect(200);

      expect(patchRes.body.periodId).toBeNull();
    });

    it('should return 404 for non-existent period', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await auth(
        apiRequest(app).patch(`/api/v1/media/${mediaRes.body.id}`),
        user,
      )
        .send({ periodId: fakeId })
        .expect(404);

      expect(res.body.error_code).toBe('EVENT_PERIOD_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR when period does not cover the day', async () => {
      const user = await registerTestUser(app);
      // Period covers only 2020
      const { periodId } = await createPeriodForUser(
        user,
        '2020-01-01',
        '2020-12-31',
      );

      const dto = validMediaDto(user.userId);
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      const res = await auth(
        apiRequest(app).patch(`/api/v1/media/${mediaRes.body.id}`),
        user,
      )
        .send({ periodId })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 MEDIA_NOT_FOUND for random media UUID', async () => {
      const user = await registerTestUser(app);
      const fakeId = '00000000-0000-4000-a000-000000000000';

      const res = await auth(
        apiRequest(app).patch(`/api/v1/media/${fakeId}`),
        user,
      )
        .send({ periodId: null })
        .expect(404);

      expect(res.body.error_code).toBe('MEDIA_NOT_FOUND');
    });

    it('should return 404 when user A tries to patch user B media (IDOR)', async () => {
      const userA = await registerTestUser(app);
      const userB = await registerTestUser(app);

      // User A creates media
      const dto = validMediaDto(userA.userId);
      const mediaRes = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        userA,
      )
        .send(dto)
        .expect(201);

      // User B tries to patch it
      const res = await auth(
        apiRequest(app).patch(`/api/v1/media/${mediaRes.body.id}`),
        userB,
      )
        .send({ periodId: null })
        .expect(404);

      expect(res.body.error_code).toBe('MEDIA_NOT_FOUND');
    });
  });

  describe('POST /api/v1/days/:date/media with periodId', () => {
    it('should create media with periodId when provided', async () => {
      const user = await registerTestUser(app);

      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        user,
      )
        .send({ name: 'Test', color: '#FF0000' })
        .expect(201);

      const groupRes = await auth(
        apiRequest(app).post('/api/v1/event-groups'),
        user,
      )
        .send({ categoryId: catRes.body.id, title: 'Chapter' })
        .expect(201);

      const periodRes = await auth(
        apiRequest(app).post(
          `/api/v1/event-groups/${groupRes.body.id}/periods`,
        ),
        user,
      )
        .send({ startDate: '2024-01-01', endDate: '2099-12-31' })
        .expect(201);

      const periodId = periodRes.body.periods[0].id;

      const dto = { ...validMediaDto(user.userId), periodId };
      const res = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      expect(res.body.periodId).toBe(periodId);
    });

    it('should create media without periodId (backward compat)', async () => {
      const user = await registerTestUser(app);
      const dto = validMediaDto(user.userId);

      const res = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        user,
      )
        .send(dto)
        .expect(201);

      expect(res.body.periodId).toBeNull();
    });

    it('should return 404 when using another user periodId (IDOR)', async () => {
      const userA = await registerTestUser(app);
      const userB = await registerTestUser(app);

      // User A creates a period
      const catRes = await auth(
        apiRequest(app).post('/api/v1/categories'),
        userA,
      )
        .send({ name: 'Test', color: '#FF0000' })
        .expect(201);

      const groupRes = await auth(
        apiRequest(app).post('/api/v1/event-groups'),
        userA,
      )
        .send({ categoryId: catRes.body.id, title: 'Chapter' })
        .expect(201);

      const periodRes = await auth(
        apiRequest(app).post(
          `/api/v1/event-groups/${groupRes.body.id}/periods`,
        ),
        userA,
      )
        .send({ startDate: '2024-01-01', endDate: '2099-12-31' })
        .expect(201);

      const periodId = periodRes.body.periods[0].id;

      // User B tries to create media with User A's periodId
      const dto = { ...validMediaDto(userB.userId), periodId };
      const res = await auth(
        apiRequest(app).post(`/api/v1/days/${TODAY}/media`),
        userB,
      )
        .send(dto)
        .expect(404);

      expect(res.body.error_code).toBe('EVENT_PERIOD_NOT_FOUND');
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
