import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Event Groups E2E', () => {
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

  /** Helper: create a category for event group tests. */
  async function createCategory(user: TestUser, name = 'Work') {
    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name, color: '#FF5733' })
      .expect(201);
    return res.body;
  }

  /** Helper: create an event group. */
  async function createEventGroup(
    user: TestUser,
    categoryId: string,
    title = 'Test Chapter',
  ) {
    const res = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId, title })
      .expect(201);
    return res.body;
  }

  /** Helper: create a period for a group. */
  async function createPeriod(
    user: TestUser,
    groupId: string,
    body: { startDate: string; endDate?: string; comment?: string },
  ) {
    const res = await apiRequest(app)
      .post(`/api/v1/event-groups/${groupId}/periods`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(body)
      .expect(201);
    return res.body;
  }

  // ────────────────────────────────────────────────────────────
  // Happy-path CRUD
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/event-groups — should create an event group', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);

    const res = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId: category.id, title: 'My Chapter' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('My Chapter');
    expect(res.body.category).toBeTruthy();
    expect(res.body.category.id).toBe(category.id);
    expect(res.body).toHaveProperty('periods');
    expect(Array.isArray(res.body.periods)).toBe(true);
  });

  it('GET /api/v1/event-groups — should return list of groups', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    await createEventGroup(user, category.id, 'Ch1');
    await createEventGroup(user, category.id, 'Ch2');

    const res = await apiRequest(app)
      .get('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('GET /api/v1/event-groups/:id — should return single group', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    const group = await createEventGroup(user, category.id, 'Solo');

    const res = await apiRequest(app)
      .get(`/api/v1/event-groups/${group.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(group.id);
    expect(res.body.title).toBe('Solo');
  });

  it('PATCH /api/v1/event-groups/:id — should update title', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    const group = await createEventGroup(user, category.id);

    const res = await apiRequest(app)
      .patch(`/api/v1/event-groups/${group.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);

    expect(res.body.title).toBe('Updated Title');
  });

  it('PATCH — should update categoryId', async () => {
    const user = await registerTestUser(app);
    const cat1 = await createCategory(user, 'Cat1');
    const cat2 = await createCategory(user, 'Cat2');
    const group = await createEventGroup(user, cat1.id);

    const res = await apiRequest(app)
      .patch(`/api/v1/event-groups/${group.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId: cat2.id })
      .expect(200);

    expect(res.body.category.id).toBe(cat2.id);
  });

  it('DELETE /api/v1/event-groups/:id — should return 204 (no periods)', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    const group = await createEventGroup(user, category.id);

    await apiRequest(app)
      .delete(`/api/v1/event-groups/${group.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    // Verify removed
    const res = await apiRequest(app)
      .get('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body.length).toBe(0);
  });

  // ────────────────────────────────────────────────────────────
  // Delete with periods (in use)
  // ────────────────────────────────────────────────────────────

  it('DELETE should return 409 EVENT_GROUP_IN_USE when group has periods', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    const group = await createEventGroup(user, category.id);

    await createPeriod(user, group.id, {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const res = await apiRequest(app)
      .delete(`/api/v1/event-groups/${group.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(409);

    expect(res.body.error_code).toBe('EVENT_GROUP_IN_USE');
  });

  // ────────────────────────────────────────────────────────────
  // Not found
  // ────────────────────────────────────────────────────────────

  it('should return 404 EVENT_GROUP_NOT_FOUND for random UUID', async () => {
    const user = await registerTestUser(app);
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .get(`/api/v1/event-groups/${randomId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(404);

    expect(res.body.error_code).toBe('EVENT_GROUP_NOT_FOUND');
  });

  // ────────────────────────────────────────────────────────────
  // Invalid categoryId
  // ────────────────────────────────────────────────────────────

  it('should return 404 CATEGORY_NOT_FOUND for invalid categoryId', async () => {
    const user = await registerTestUser(app);
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId: randomId, title: 'Ghost Category' })
      .expect(404);

    expect(res.body.error_code).toBe('CATEGORY_NOT_FOUND');
  });

  // ────────────────────────────────────────────────────────────
  // Tier limits
  // ────────────────────────────────────────────────────────────

  it('should return 403 QUOTA_EXCEEDED when FREE tier limit reached (5 chapters)', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);

    for (let i = 0; i < 5; i++) {
      await createEventGroup(user, category.id, `Ch${i}`);
    }

    const res = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId: category.id, title: 'Ch6' })
      .expect(403);

    expect(res.body.error_code).toBe('QUOTA_EXCEEDED');
    expect(res.body.details).toHaveProperty('resource', 'chapters');
  });

  // ────────────────────────────────────────────────────────────
  // Details endpoint
  // ────────────────────────────────────────────────────────────

  it('GET /api/v1/event-groups/:id/details — should return group with analytics field', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    const group = await createEventGroup(user, category.id);

    const res = await apiRequest(app)
      .get(`/api/v1/event-groups/${group.id}/details`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', group.id);
    expect(res.body).toHaveProperty('analytics');
    expect(res.body.analytics).toHaveProperty('totalPeriods');
    expect(res.body.analytics).toHaveProperty('totalDays');
    expect(res.body.analytics).toHaveProperty('totalMedia');
    expect(res.body.analytics).toHaveProperty('moodDistribution');
    expect(res.body.analytics).toHaveProperty('density');
  });

  // ────────────────────────────────────────────────────────────
  // Auth guards
  // ────────────────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED without token', async () => {
    const res = await apiRequest(app).get('/api/v1/event-groups').expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
