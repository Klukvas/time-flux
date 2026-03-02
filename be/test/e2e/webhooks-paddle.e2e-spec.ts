import type { INestApplication } from '@nestjs/common';
import { apiRequest } from '../helpers/openapi-validator';
import type request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { truncateAllTables, getPrisma } from '../helpers/test-db.helper';
import { registerTestUser, type TestUser } from '../helpers/test-auth.helper';
import {
  buildPaddleSignature,
  buildSubscriptionCreatedPayload,
  buildSubscriptionCanceledPayload,
  buildSubscriptionUpdatedPayload,
  buildSubscriptionPastDuePayload,
  pollSubscription,
} from '../helpers/test-webhook.helper';

describe('Webhooks Paddle E2E', () => {
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

  function sendWebhook(payload: object) {
    const rawBody = JSON.stringify(payload);
    const sig = buildPaddleSignature(rawBody);
    return apiRequest(app)
      .post('/api/v1/webhooks/paddle')
      .set('Content-Type', 'application/json')
      .set('paddle-signature', sig)
      .send(payload);
  }

  describe('POST /api/v1/webhooks/paddle', () => {
    it('should accept a valid signed payload', async () => {
      const payload = {
        event_id: 'evt_valid_sig',
        event_type: 'transaction.completed',
        data: { id: 'txn_1' },
      };

      const res = await sendWebhook(payload).expect(200);

      expect(res.body).toEqual({ received: true });
    });

    it('should return 401 when paddle-signature header is missing', async () => {
      const res = await apiRequest(app)
        .post('/api/v1/webhooks/paddle')
        .set('Content-Type', 'application/json')
        .send({ event_id: 'evt_no_sig', event_type: 'test', data: {} })
        .expect(401);

      expect(res.body.error_code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for an invalid signature', async () => {
      const res = await apiRequest(app)
        .post('/api/v1/webhooks/paddle')
        .set('Content-Type', 'application/json')
        .set('paddle-signature', 'ts=123456;h1=badhash')
        .send({ event_id: 'evt_bad_sig', event_type: 'test', data: {} })
        .expect(401);

      expect(res.body.error_code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for malformed signature format', async () => {
      const res = await apiRequest(app)
        .post('/api/v1/webhooks/paddle')
        .set('Content-Type', 'application/json')
        .set('paddle-signature', 'malformed-no-ts-or-h1')
        .send({ event_id: 'evt_malformed', event_type: 'test', data: {} })
        .expect(401);

      expect(res.body.error_code).toBe('UNAUTHORIZED');
    });

    it('should process subscription.created and upgrade to PRO', async () => {
      const user = await registerTestUser(app);
      const prisma = getPrisma(app);

      // Ensure subscription record exists
      await prisma.subscription.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId, tier: 'FREE', status: 'ACTIVE' },
        update: {},
      });

      const payload = buildSubscriptionCreatedPayload({
        eventId: 'evt_created_pro',
        userId: user.userId,
        subscriptionId: 'sub_test_created',
        customerId: 'cus_test_created',
        priceId: 'pri_pro_test',
      });

      await sendWebhook(payload).expect(200);
      await pollSubscription(
        app,
        { userId: user.userId },
        (sub) => sub.tier === 'PRO',
      );

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(subRes.body.tier).toBe('PRO');
    });

    it('should process subscription.canceled and revert to FREE', async () => {
      const user = await registerTestUser(app);
      const prisma = getPrisma(app);

      await prisma.subscription.upsert({
        where: { userId: user.userId },
        create: {
          userId: user.userId,
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_cancel',
        },
        update: {
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_cancel',
        },
      });

      const payload = buildSubscriptionCanceledPayload({
        eventId: 'evt_canceled',
        subscriptionId: 'sub_test_cancel',
      });

      await sendWebhook(payload).expect(200);
      await pollSubscription(
        app,
        { userId: user.userId },
        (sub) => sub.status === 'CANCELED',
      );

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(subRes.body.tier).toBe('FREE');
      expect(subRes.body.status).toBe('CANCELED');
    });

    it('should process subscription.updated with new price', async () => {
      const user = await registerTestUser(app);
      const prisma = getPrisma(app);

      await prisma.subscription.upsert({
        where: { userId: user.userId },
        create: {
          userId: user.userId,
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_update',
        },
        update: {
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_update',
        },
      });

      const payload = buildSubscriptionUpdatedPayload({
        eventId: 'evt_updated',
        subscriptionId: 'sub_test_update',
        priceId: 'pri_premium_test',
      });

      await sendWebhook(payload).expect(200);
      await pollSubscription(
        app,
        { userId: user.userId },
        (sub) => sub.tier === 'PREMIUM',
      );

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(subRes.body.tier).toBe('PREMIUM');
    });

    it('should process subscription.past_due and update status', async () => {
      const user = await registerTestUser(app);
      const prisma = getPrisma(app);

      await prisma.subscription.upsert({
        where: { userId: user.userId },
        create: {
          userId: user.userId,
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_past_due',
        },
        update: {
          tier: 'PRO',
          status: 'ACTIVE',
          paddleSubscriptionId: 'sub_test_past_due',
        },
      });

      const payload = buildSubscriptionPastDuePayload({
        eventId: 'evt_past_due',
        subscriptionId: 'sub_test_past_due',
      });

      await sendWebhook(payload).expect(200);
      await pollSubscription(
        app,
        { userId: user.userId },
        (sub) => sub.status === 'PAST_DUE',
      );

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      expect(subRes.body.status).toBe('PAST_DUE');
    });

    it('should handle idempotency (duplicate event_id)', async () => {
      const user = await registerTestUser(app);
      const prisma = getPrisma(app);

      await prisma.subscription.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId, tier: 'FREE', status: 'ACTIVE' },
        update: {},
      });

      const payload = buildSubscriptionCreatedPayload({
        eventId: 'evt_idempotent',
        userId: user.userId,
        subscriptionId: 'sub_test_idem',
        customerId: 'cus_test_idem',
        priceId: 'pri_pro_test',
      });

      // Send the same event twice
      await sendWebhook(payload).expect(200);
      await pollSubscription(
        app,
        { userId: user.userId },
        (sub) => sub.tier === 'PRO',
      );
      await sendWebhook(payload).expect(200);

      // Wait briefly for second event to be (not) processed
      await new Promise((r) => setTimeout(r, 200));

      // Verify only one webhook_event record was created (deduplication)
      const event = await prisma.webhookEvent.findUnique({
        where: { id: 'evt_idempotent' },
      });
      expect(event).toBeTruthy();

      const subRes = await auth(
        apiRequest(app).get('/api/v1/subscriptions'),
        user,
      ).expect(200);

      // Should still be PRO (not double-processed causing issues)
      expect(subRes.body.tier).toBe('PRO');
    });

    it('should return 200 for unknown event types without crashing', async () => {
      const payload = {
        event_id: 'evt_unknown',
        event_type: 'transaction.completed',
        data: { id: 'txn_unknown' },
      };

      const res = await sendWebhook(payload).expect(200);

      expect(res.body).toEqual({ received: true });
    });
  });
});
