import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Day States E2E', () => {
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

  const validDayState = { name: 'Great', color: '#4CAF50', score: 9 };

  /** Helper: create a day state for the given user. */
  async function createDayState(
    user: TestUser,
    overrides?: Partial<typeof validDayState>,
  ) {
    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ ...validDayState, ...overrides })
      .expect(201);
    return res.body;
  }

  // ────────────────────────────────────────────────────────────
  // Happy-path CRUD
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/day-states — should create a day state', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(validDayState)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Great');
    expect(res.body.color).toBe('#4CAF50');
    expect(res.body).toHaveProperty('isSystem');
    expect(res.body).toHaveProperty('order');
    expect(res.body.score).toBe(9);
  });

  it('GET /api/v1/day-states — should return array of day states', async () => {
    const user = await registerTestUser(app);
    await createDayState(user, { name: 'Good', score: 7 });
    await createDayState(user, { name: 'Bad', color: '#FF0000', score: 3 });

    const res = await apiRequest(app)
      .get('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('score');
  });

  it('PATCH /api/v1/day-states/:id — should update name and score', async () => {
    const user = await registerTestUser(app);
    const dayState = await createDayState(user);

    const res = await apiRequest(app)
      .patch(`/api/v1/day-states/${dayState.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Amazing', score: 10 })
      .expect(200);

    expect(res.body.name).toBe('Amazing');
    expect(res.body.score).toBe(10);
  });

  it('DELETE /api/v1/day-states/:id — should return 204', async () => {
    const user = await registerTestUser(app);
    const dayState = await createDayState(user);

    await apiRequest(app)
      .delete(`/api/v1/day-states/${dayState.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    // Verify it is gone
    const res = await apiRequest(app)
      .get('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body.length).toBe(0);
  });

  // ────────────────────────────────────────────────────────────
  // Validation errors
  // ────────────────────────────────────────────────────────────

  it('should return 400 VALIDATION_ERROR for score out of range (11)', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Overflow', color: '#FF0000', score: 11 })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for score out of range (-1)', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Negative', color: '#FF0000', score: -1 })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for invalid color', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'BadColor', color: 'xyz', score: 5 })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  // ────────────────────────────────────────────────────────────
  // Not found
  // ────────────────────────────────────────────────────────────

  it('should return 404 DAY_STATE_NOT_FOUND for random UUID', async () => {
    const user = await registerTestUser(app);
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .patch(`/api/v1/day-states/${randomId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Ghost' })
      .expect(404);

    expect(res.body.error_code).toBe('DAY_STATE_NOT_FOUND');
  });

  // ────────────────────────────────────────────────────────────
  // Day state in use
  // ────────────────────────────────────────────────────────────

  it('should return 409 DAY_STATE_IN_USE when day state is assigned to a day', async () => {
    const user = await registerTestUser(app);
    const dayState = await createDayState(user);

    // Create a day using this day state
    await apiRequest(app)
      .put('/api/v1/days/2024-01-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ dayStateId: dayState.id })
      .expect(200);

    // Try to delete — should fail
    const res = await apiRequest(app)
      .delete(`/api/v1/day-states/${dayState.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(409);

    expect(res.body.error_code).toBe('DAY_STATE_IN_USE');
  });

  // ────────────────────────────────────────────────────────────
  // From recommendation
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/day-states/from-recommendation — should create from recommendation', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/day-states/from-recommendation')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ key: 'great', name: 'Great' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Great');
    expect(res.body).toHaveProperty('color');
    expect(res.body).toHaveProperty('score');
  });

  // ────────────────────────────────────────────────────────────
  // Tier limits
  // ────────────────────────────────────────────────────────────

  it('should return 403 QUOTA_EXCEEDED when FREE tier limit reached (5 day states)', async () => {
    const user = await registerTestUser(app);
    const colors = ['#AA0000', '#BB0000', '#CC0000', '#DD0000', '#EE0000'];

    for (let i = 0; i < 5; i++) {
      await createDayState(user, {
        name: `State${i}`,
        color: colors[i],
        score: i * 2,
      });
    }

    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'State6', color: '#FF0000', score: 5 })
      .expect(403);

    expect(res.body.error_code).toBe('QUOTA_EXCEEDED');
    expect(res.body.details).toHaveProperty('resource', 'dayStates');
  });

  // ────────────────────────────────────────────────────────────
  // Auth guards
  // ────────────────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED without token', async () => {
    const res = await apiRequest(app).get('/api/v1/day-states').expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
