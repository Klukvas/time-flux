import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';

describe('Health E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return status ok with database connected', async () => {
      const res = await apiRequest(app).get('/api/v1/health').expect(200);

      expect(res.body).toEqual({
        status: 'ok',
        database: 'connected',
      });
    });
  });
});
