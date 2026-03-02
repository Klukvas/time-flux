import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Days E2E', () => {
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

  /** Helper: create a day state so we can reference it. */
  async function createDayState(user: TestUser) {
    const res = await apiRequest(app)
      .post('/api/v1/day-states')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Good', color: '#4CAF50', score: 7 })
      .expect(201);
    return res.body;
  }

  // ────────────────────────────────────────────────────────────
  // Upsert
  // ────────────────────────────────────────────────────────────

  it('PUT /api/v1/days/2024-06-15 — should upsert-create a day', async () => {
    const user = await registerTestUser(app);
    const dayState = await createDayState(user);

    const res = await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ dayStateId: dayState.id })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.date).toBe('2024-06-15');
    expect(res.body.dayState).toBeTruthy();
    expect(res.body.dayState.id).toBe(dayState.id);
  });

  it('PUT same date twice — should update (upsert)', async () => {
    const user = await registerTestUser(app);

    await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'First' })
      .expect(200);

    const res = await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Updated' })
      .expect(200);

    expect(res.body.comment).toBe('Updated');
  });

  it('should set comment on upsert', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Had a great day!' })
      .expect(200);

    expect(res.body.comment).toBe('Had a great day!');
  });

  it('should clear dayState by passing null', async () => {
    const user = await registerTestUser(app);
    const dayState = await createDayState(user);

    // Set day state first
    await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ dayStateId: dayState.id })
      .expect(200);

    // Clear day state
    const res = await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ dayStateId: null })
      .expect(200);

    expect(res.body.dayState).toBeNull();
  });

  it('should fail for invalid dayStateId (random UUID)', async () => {
    const user = await registerTestUser(app);
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ dayStateId: randomId })
      .expect(404);

    expect(res.body.error_code).toBe('DAY_STATE_NOT_FOUND');
  });

  it('should return 400 FUTURE_DATE for far-future date', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .put('/api/v1/days/2099-01-01')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Future' })
      .expect(400);

    expect(res.body.error_code).toBe('FUTURE_DATE');
  });

  // ────────────────────────────────────────────────────────────
  // Location
  // ────────────────────────────────────────────────────────────

  it('PATCH /api/v1/days/2024-06-15/location — should set location', async () => {
    const user = await registerTestUser(app);

    // Ensure day exists first
    await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({})
      .expect(200);

    const res = await apiRequest(app)
      .patch('/api/v1/days/2024-06-15/location')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        locationName: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
      })
      .expect(200);

    expect(res.body.locationName).toBe('Kyiv, Ukraine');
    expect(res.body.latitude).toBeCloseTo(50.4501);
    expect(res.body.longitude).toBeCloseTo(30.5234);
  });

  it('PATCH location — should clear location fields with null', async () => {
    const user = await registerTestUser(app);

    // Create day with location
    await apiRequest(app)
      .put('/api/v1/days/2024-06-15')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({})
      .expect(200);

    await apiRequest(app)
      .patch('/api/v1/days/2024-06-15/location')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ locationName: 'Kyiv', latitude: 50.45, longitude: 30.52 })
      .expect(200);

    // Clear
    const res = await apiRequest(app)
      .patch('/api/v1/days/2024-06-15/location')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ locationName: null, latitude: null, longitude: null })
      .expect(200);

    expect(res.body.locationName).toBeNull();
    expect(res.body.latitude).toBeNull();
    expect(res.body.longitude).toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // Query
  // ────────────────────────────────────────────────────────────

  it('GET /api/v1/days?from=...&to=... — should return days in range', async () => {
    const user = await registerTestUser(app);

    await apiRequest(app)
      .put('/api/v1/days/2024-06-10')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Day 10' })
      .expect(200);

    await apiRequest(app)
      .put('/api/v1/days/2024-06-20')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Day 20' })
      .expect(200);

    const res = await apiRequest(app)
      .get('/api/v1/days')
      .query({ from: '2024-06-01', to: '2024-06-30' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('should return 400 INVALID_DATE_RANGE when from > to', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .get('/api/v1/days')
      .query({ from: '2024-06-30', to: '2024-06-01' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(400);

    expect(res.body.error_code).toBe('INVALID_DATE_RANGE');
  });

  // ────────────────────────────────────────────────────────────
  // Auth guards
  // ────────────────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED without token', async () => {
    const res = await apiRequest(app)
      .get('/api/v1/days')
      .query({ from: '2024-06-01', to: '2024-06-30' })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
