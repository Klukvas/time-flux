import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';

describe('Event Periods E2E', () => {
  let app: INestApplication;
  let user: TestUser;
  let categoryId: string;
  let groupId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);

    // Create fresh user + category + event group for each test
    user = await registerTestUser(app);

    const catRes = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Work', color: '#FF5733' })
      .expect(201);
    categoryId = catRes.body.id;

    const groupRes = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId, title: 'Test Chapter' })
      .expect(201);
    groupId = groupRes.body.id;
  });

  /** Helper: create a period and return the whole group response. */
  async function createPeriod(body: {
    startDate: string;
    endDate?: string;
    comment?: string;
  }) {
    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(body)
      .expect(201);
    return res.body;
  }

  /** Helper: find a period by startDate. */
  function findPeriod(groupResponse: any, startDate: string) {
    return groupResponse.periods.find((p: any) => p.startDate === startDate);
  }

  // ────────────────────────────────────────────────────────────
  // Create
  // ────────────────────────────────────────────────────────────

  it('should create a closed period', async () => {
    const group = await createPeriod({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const period = findPeriod(group, '2024-01-01');
    expect(period).toBeTruthy();
    expect(period.startDate).toBe('2024-01-01');
    expect(period.endDate).toBe('2024-01-31');
  });

  it('should create an open period (no endDate)', async () => {
    const group = await createPeriod({ startDate: '2024-06-01' });

    const period = findPeriod(group, '2024-06-01');
    expect(period).toBeTruthy();
    expect(period.startDate).toBe('2024-06-01');
    expect(period.endDate).toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // Update
  // ────────────────────────────────────────────────────────────

  it('PATCH /api/v1/periods/:id — should update comment', async () => {
    const group = await createPeriod({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    const periodId = findPeriod(group, '2024-01-01').id;

    const res = await apiRequest(app)
      .patch(`/api/v1/periods/${periodId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Updated comment' })
      .expect(200);

    const updated = findPeriod(res.body, '2024-01-01');
    expect(updated.comment).toBe('Updated comment');
  });

  // ────────────────────────────────────────────────────────────
  // Close
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/periods/:id/close — should close an open period', async () => {
    const group = await createPeriod({ startDate: '2024-06-01' });
    const periodId = findPeriod(group, '2024-06-01').id;

    const res = await apiRequest(app)
      .post(`/api/v1/periods/${periodId}/close`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endDate: '2024-06-30' })
      .expect(201);

    const closed = findPeriod(res.body, '2024-06-01');
    expect(closed.endDate).toBe('2024-06-30');
  });

  // ────────────────────────────────────────────────────────────
  // Delete
  // ────────────────────────────────────────────────────────────

  it('DELETE /api/v1/periods/:id — should return 204', async () => {
    const group = await createPeriod({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    const periodId = findPeriod(group, '2024-01-01').id;

    await apiRequest(app)
      .delete(`/api/v1/periods/${periodId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);
  });

  // ────────────────────────────────────────────────────────────
  // Already closed
  // ────────────────────────────────────────────────────────────

  it('should return 409 EVENT_ALREADY_CLOSED when closing a closed period', async () => {
    const group = await createPeriod({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    const periodId = findPeriod(group, '2024-01-01').id;

    const res = await apiRequest(app)
      .post(`/api/v1/periods/${periodId}/close`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endDate: '2024-02-28' })
      .expect(409);

    expect(res.body.error_code).toBe('EVENT_ALREADY_CLOSED');
  });

  // ────────────────────────────────────────────────────────────
  // Invalid date range
  // ────────────────────────────────────────────────────────────

  it('should return 400 INVALID_DATE_RANGE when endDate before startDate', async () => {
    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2024-03-31', endDate: '2024-03-01' })
      .expect(400);

    expect(res.body.error_code).toBe('INVALID_DATE_RANGE');
  });

  // ────────────────────────────────────────────────────────────
  // Future date
  // ────────────────────────────────────────────────────────────

  it('should return 400 FUTURE_DATE for far-future startDate', async () => {
    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2099-01-01' })
      .expect(400);

    expect(res.body.error_code).toBe('FUTURE_DATE');
  });

  // ────────────────────────────────────────────────────────────
  // One active period per group
  // ────────────────────────────────────────────────────────────

  it('should return 409 ACTIVE_PERIOD_EXISTS when creating second open period', async () => {
    await createPeriod({ startDate: '2024-06-01' });

    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2024-07-01' })
      .expect(409);

    expect(res.body.error_code).toBe('ACTIVE_PERIOD_EXISTS');
  });

  // ────────────────────────────────────────────────────────────
  // Overlap — fully contained
  // ────────────────────────────────────────────────────────────

  it('should return 409 PERIOD_OVERLAP for fully contained period', async () => {
    await createPeriod({ startDate: '2024-01-01', endDate: '2024-03-31' });

    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2024-02-01', endDate: '2024-02-28' })
      .expect(409);

    expect(res.body.error_code).toBe('PERIOD_OVERLAP');
  });

  // ────────────────────────────────────────────────────────────
  // Overlap — partial
  // ────────────────────────────────────────────────────────────

  it('should return 409 PERIOD_OVERLAP for partial overlap', async () => {
    await createPeriod({ startDate: '2024-01-01', endDate: '2024-03-31' });

    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2024-02-15', endDate: '2024-04-15' })
      .expect(409);

    expect(res.body.error_code).toBe('PERIOD_OVERLAP');
  });

  // ────────────────────────────────────────────────────────────
  // Boundary sharing allowed
  // ────────────────────────────────────────────────────────────

  it('should allow boundary-sharing periods (Jan 31 end, Feb 01 start)', async () => {
    await createPeriod({ startDate: '2024-01-01', endDate: '2024-01-31' });

    const group = await createPeriod({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });

    // Both periods should exist
    expect(group.periods.length).toBe(2);
  });

  // ────────────────────────────────────────────────────────────
  // Non-overlapping success
  // ────────────────────────────────────────────────────────────

  it('should allow non-overlapping periods (Jan + Mar)', async () => {
    await createPeriod({ startDate: '2024-01-01', endDate: '2024-01-31' });

    const group = await createPeriod({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });

    expect(group.periods.length).toBe(2);
  });

  // ────────────────────────────────────────────────────────────
  // Update causes overlap
  // ────────────────────────────────────────────────────────────

  it('should return 409 PERIOD_OVERLAP when update causes overlap', async () => {
    // Create two non-overlapping periods
    await createPeriod({ startDate: '2024-01-01', endDate: '2024-01-31' });
    const group = await createPeriod({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });

    const marchPeriod = findPeriod(group, '2024-03-01');

    // Update the March period to overlap with January
    const res = await apiRequest(app)
      .patch(`/api/v1/periods/${marchPeriod.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2024-01-15' })
      .expect(409);

    expect(res.body.error_code).toBe('PERIOD_OVERLAP');
  });

  // ────────────────────────────────────────────────────────────
  // Not found
  // ────────────────────────────────────────────────────────────

  it('should return 404 EVENT_PERIOD_NOT_FOUND for random UUID', async () => {
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .patch(`/api/v1/periods/${randomId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ comment: 'Ghost' })
      .expect(404);

    expect(res.body.error_code).toBe('EVENT_PERIOD_NOT_FOUND');
  });

  // ────────────────────────────────────────────────────────────
  // Auth guards
  // ────────────────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED without token', async () => {
    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .send({ startDate: '2024-01-01' })
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
