import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Uploads E2E', () => {
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

  describe('POST /api/v1/uploads/presigned-url', () => {
    it('should return uploadUrl and key', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post('/api/v1/uploads/presigned-url'),
        user,
      )
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 102400,
        })
        .expect(201);

      expect(res.body).toHaveProperty('uploadUrl');
      expect(res.body).toHaveProperty('key');
      expect(typeof res.body.uploadUrl).toBe('string');
      expect(typeof res.body.key).toBe('string');
    });

    it('should include userId in the key', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post('/api/v1/uploads/presigned-url'),
        user,
      )
        .send({
          fileName: 'photo.png',
          contentType: 'image/png',
          size: 50000,
        })
        .expect(201);

      expect(res.body.key).toContain(user.userId);
    });

    it('should return 400 VALIDATION_ERROR for invalid content type', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post('/api/v1/uploads/presigned-url'),
        user,
      )
        .send({
          fileName: 'document.pdf',
          contentType: 'application/pdf',
          size: 1024,
        })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 VALIDATION_ERROR for file too large', async () => {
      const user = await registerTestUser(app);

      const res = await auth(
        apiRequest(app).post('/api/v1/uploads/presigned-url'),
        user,
      )
        .send({
          fileName: 'bigfile.jpg',
          contentType: 'image/jpeg',
          size: 99999999,
        })
        .expect(400);

      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth', async () => {
      await apiRequest(app)
        .post('/api/v1/uploads/presigned-url')
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
        .expect(401);
    });
  });
});
