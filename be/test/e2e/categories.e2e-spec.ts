import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import { setUserTier } from '../helpers/test-subscription.helper';

describe('Categories E2E', () => {
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

  const validCategory = { name: 'Work', color: '#FF5733' };

  /** Helper: create a category for the given user. */
  async function createCategory(
    user: TestUser,
    overrides?: Partial<typeof validCategory>,
  ) {
    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ ...validCategory, ...overrides })
      .expect(201);
    return res.body;
  }

  /** Helper: create an event group tied to a category. */
  async function createEventGroup(user: TestUser, categoryId: string) {
    const res = await apiRequest(app)
      .post('/api/v1/event-groups')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ categoryId, title: 'Test Chapter' })
      .expect(201);
    return res.body;
  }

  // ────────────────────────────────────────────────────────────
  // Happy-path CRUD
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/categories — should create a category', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(validCategory)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Work');
    expect(res.body.color).toBe('#FF5733');
    expect(res.body).toHaveProperty('isSystem');
    expect(res.body).toHaveProperty('order');
  });

  it('GET /api/v1/categories — should return array of categories', async () => {
    const user = await registerTestUser(app);
    await createCategory(user, { name: 'Cat1' });
    await createCategory(user, { name: 'Cat2', color: '#00FF00' });

    const res = await apiRequest(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  it('PATCH /api/v1/categories/:id — should update name and color', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);

    const res = await apiRequest(app)
      .patch(`/api/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Updated', color: '#000000' })
      .expect(200);

    expect(res.body.name).toBe('Updated');
    expect(res.body.color).toBe('#000000');
  });

  it('DELETE /api/v1/categories/:id — should return 204', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);

    await apiRequest(app)
      .delete(`/api/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    // Verify it is gone
    const res = await apiRequest(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body.length).toBe(0);
  });

  // ────────────────────────────────────────────────────────────
  // Validation errors
  // ────────────────────────────────────────────────────────────

  it('should return 400 VALIDATION_ERROR for invalid color format', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Bad Color', color: 'not-hex' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  it('should return 400 VALIDATION_ERROR for missing name', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ color: '#FF5733' })
      .expect(400);

    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
  });

  // ────────────────────────────────────────────────────────────
  // Not found
  // ────────────────────────────────────────────────────────────

  it('should return 404 CATEGORY_NOT_FOUND for random UUID', async () => {
    const user = await registerTestUser(app);
    const randomId = '00000000-0000-4000-a000-000000000000';

    const res = await apiRequest(app)
      .patch(`/api/v1/categories/${randomId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Ghost' })
      .expect(404);

    expect(res.body.error_code).toBe('CATEGORY_NOT_FOUND');
  });

  // ────────────────────────────────────────────────────────────
  // Category in use
  // ────────────────────────────────────────────────────────────

  it('should return 409 CATEGORY_IN_USE when category has event groups', async () => {
    const user = await registerTestUser(app);
    const category = await createCategory(user);
    await createEventGroup(user, category.id);

    const res = await apiRequest(app)
      .delete(`/api/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(409);

    expect(res.body.error_code).toBe('CATEGORY_IN_USE');
  });

  // ────────────────────────────────────────────────────────────
  // From recommendation
  // ────────────────────────────────────────────────────────────

  it('POST /api/v1/categories/from-recommendation — should create from recommendation', async () => {
    const user = await registerTestUser(app);

    const res = await apiRequest(app)
      .post('/api/v1/categories/from-recommendation')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ key: 'work', name: 'Work' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Work');
    expect(res.body).toHaveProperty('color');
  });

  // ────────────────────────────────────────────────────────────
  // Tier limits
  // ────────────────────────────────────────────────────────────

  it('should return 403 QUOTA_EXCEEDED when FREE tier limit reached (5 categories)', async () => {
    const user = await registerTestUser(app);
    const colors = ['#AA0000', '#BB0000', '#CC0000', '#DD0000', '#EE0000'];

    for (let i = 0; i < 5; i++) {
      await createCategory(user, { name: `Cat${i}`, color: colors[i] });
    }

    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Cat6', color: '#FF0000' })
      .expect(403);

    expect(res.body.error_code).toBe('QUOTA_EXCEEDED');
    expect(res.body.details).toHaveProperty('resource', 'categories');
  });

  it('should allow 6th category after upgrading to PRO', async () => {
    const user = await registerTestUser(app);
    const colors = ['#AA0000', '#BB0000', '#CC0000', '#DD0000', '#EE0000'];

    for (let i = 0; i < 5; i++) {
      await createCategory(user, { name: `Cat${i}`, color: colors[i] });
    }

    await setUserTier(app, user.userId, 'PRO');

    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Cat6', color: '#FF0000' })
      .expect(201);

    expect(res.body.name).toBe('Cat6');
  });

  // ────────────────────────────────────────────────────────────
  // Auth guards
  // ────────────────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED on GET without token', async () => {
    const res = await apiRequest(app).get('/api/v1/categories').expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 UNAUTHORIZED on POST without token', async () => {
    const res = await apiRequest(app)
      .post('/api/v1/categories')
      .send(validCategory)
      .expect(401);

    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });
});
