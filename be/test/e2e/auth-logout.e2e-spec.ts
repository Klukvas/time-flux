import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser } from '../helpers/test-auth.helper';

describe('POST /api/v1/auth/logout', () => {
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

  it('should logout successfully and return 200', async () => {
    const user = await registerTestUser(app);

    await apiRequest(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ refresh_token: user.refreshToken })
      .expect(201);
  });

  it('should invalidate the refresh token after logout', async () => {
    const user = await registerTestUser(app);

    // Logout
    await apiRequest(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ refresh_token: user.refreshToken })
      .expect(201);

    // Attempt to refresh with the now-invalidated token
    const res = await apiRequest(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: user.refreshToken })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when no auth token is provided', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/auth/logout')
      .send({ refresh_token: user.refreshToken })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
