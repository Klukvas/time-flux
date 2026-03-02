import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Recommendations E2E', () => {
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

  describe('GET /api/v1/recommendations', () => {
    it('should return categories and moods arrays', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/recommendations'),
        user,
      ).expect(200);

      expect(res.body).toHaveProperty('categories');
      expect(res.body).toHaveProperty('moods');
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(Array.isArray(res.body.moods)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
      expect(res.body.moods.length).toBeGreaterThan(0);
    });

    it('should have proper structure for each recommendation item', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).get('/api/v1/recommendations'),
        user,
      ).expect(200);

      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      for (const item of res.body.categories) {
        expect(typeof item.key).toBe('string');
        expect(typeof item.color).toBe('string');
        expect(item.color).toMatch(hexRegex);
      }

      for (const item of res.body.moods) {
        expect(typeof item.key).toBe('string');
        expect(typeof item.color).toBe('string');
        expect(item.color).toMatch(hexRegex);
      }
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app).get('/api/v1/recommendations').expect(401);
    });
  });
});
