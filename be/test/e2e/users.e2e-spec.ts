import type { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Users Profile E2E', () => {
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

  // ─── Birth Date — Tier Gating ─────────────────────────────

  describe('PATCH /api/v1/users/profile — tier gating', () => {
    it('should reject birthDate for FREE user with 403', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        user,
      )
        .send({ birthDate: '1990-05-15' })
        .expect(403);

      expect(res.body.error_code).toBe('FEATURE_LOCKED');
    });

    it('should accept birthDate for PRO user', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PRO');

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        user,
      )
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      expect(res.body.birthDate).toBe('1990-05-15');
    });

    it('should accept birthDate for PREMIUM user', async () => {
      const user = await registerTestUser(app);
      await setUserTier(app, user.userId, 'PREMIUM');

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        user,
      )
        .send({ birthDate: '1985-12-01' })
        .expect(200);

      expect(res.body.birthDate).toBe('1985-12-01');
    });
  });

  // ─── Birth Date — Validation ──────────────────────────────

  describe('PATCH /api/v1/users/profile — validation', () => {
    let proUser: TestUser;

    beforeEach(async () => {
      proUser = await registerTestUser(app);
      await setUserTier(app, proUser.userId, 'PRO');
    });

    it('should reject future birth date', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: '2099-01-01' })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should reject user under 13 years old', async () => {
      const now = new Date();
      const tooYoung = new Date(
        Date.UTC(
          now.getUTCFullYear() - 12,
          now.getUTCMonth(),
          now.getUTCDate(),
        ),
      )
        .toISOString()
        .split('T')[0];

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: tooYoung })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should reject birth date older than 130 years', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: '1890-01-01' })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid date format (datetime string)', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: '1990-05-15T12:00:00Z' })
        .expect(400);

      expect(res.body.error_code).toBeDefined();
    });

    it('should reject malformed date string', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: 'not-a-date' })
        .expect(400);

      expect(res.body.error_code).toBeDefined();
    });
  });

  // ─── Birth Date — Set, Update, Clear ──────────────────────

  describe('PATCH /api/v1/users/profile — lifecycle', () => {
    let proUser: TestUser;

    beforeEach(async () => {
      proUser = await registerTestUser(app);
      await setUserTier(app, proUser.userId, 'PRO');
    });

    it('should set birth date and return updated user', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      expect(res.body.id).toBe(proUser.userId);
      expect(res.body.birthDate).toBe('1990-05-15');
      expect(res.body.email).toBe(proUser.email);
      expect(res.body.tier).toBe('PRO');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should update birth date to a new value', async () => {
      await auth(apiRequest(app).patch('/api/v1/users/profile'), proUser)
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: '1985-12-01' })
        .expect(200);

      expect(res.body.birthDate).toBe('1985-12-01');
    });

    it('should clear birth date by sending null', async () => {
      await auth(apiRequest(app).patch('/api/v1/users/profile'), proUser)
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({ birthDate: null })
        .expect(200);

      expect(res.body.birthDate).toBeNull();
    });

    it('should persist birthDate across login sessions', async () => {
      await auth(apiRequest(app).patch('/api/v1/users/profile'), proUser)
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      // Re-login
      const loginRes = await apiRequest(app)
        .post('/api/v1/auth/login')
        .send({ email: proUser.email, password: 'TestPass123' })
        .expect(201);

      expect(loginRes.body.user.birthDate).toBe('1990-05-15');
    });

    it('should return birthDate in token refresh response', async () => {
      await auth(apiRequest(app).patch('/api/v1/users/profile'), proUser)
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      const refreshRes = await apiRequest(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: proUser.refreshToken })
        .expect(201);

      expect(refreshRes.body.user.birthDate).toBe('1990-05-15');
    });

    it('should return current profile with no changes when body is empty', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/users/profile'),
        proUser,
      )
        .send({})
        .expect(200);

      expect(res.body.id).toBe(proUser.userId);
      expect(res.body.birthDate).toBeNull();
    });
  });

  // ─── Birth Date — Day Creation Boundary ───────────────────

  describe('Day creation respects birthDate boundary', () => {
    let proUser: TestUser;

    beforeEach(async () => {
      proUser = await registerTestUser(app);
      await setUserTier(app, proUser.userId, 'PRO');
      await auth(apiRequest(app).patch('/api/v1/users/profile'), proUser)
        .send({ birthDate: '2000-06-15' })
        .expect(200);
    });

    it('should allow creating a day on the birth date', async () => {
      const res = await auth(
        apiRequest(app).put('/api/v1/days/2000-06-15'),
        proUser,
      )
        .send({ comment: 'Born!' })
        .expect(200);

      expect(res.body.date).toBe('2000-06-15');
      expect(res.body.comment).toBe('Born!');
    });

    it('should allow creating a day after the birth date', async () => {
      const res = await auth(
        apiRequest(app).put('/api/v1/days/2010-01-01'),
        proUser,
      )
        .send({ comment: 'Childhood memory' })
        .expect(200);

      expect(res.body.date).toBe('2010-01-01');
    });

    it('should reject creating a day before the birth date', async () => {
      const res = await auth(
        apiRequest(app).put('/api/v1/days/2000-01-01'),
        proUser,
      )
        .send({ comment: 'Before birth' })
        .expect(400);

      expect(res.body.error_code).toBe('DATE_BEFORE_START');
    });

    it('should reject location update before the birth date', async () => {
      const res = await auth(
        apiRequest(app).patch('/api/v1/days/1999-12-31/location'),
        proUser,
      )
        .send({ locationName: 'Old place' })
        .expect(400);

      expect(res.body.error_code).toBe('DATE_BEFORE_START');
    });
  });

  // ─── Auth — 401 without token ─────────────────────────────

  describe('Authentication', () => {
    it('should return 401 without Authorization header', async () => {
      await apiRequest(app)
        .patch('/api/v1/users/profile')
        .send({ birthDate: '1990-05-15' })
        .expect(401);
    });
  });
});
