import { createHmac } from 'crypto';
import type { INestApplication } from '@nestjs/common';
import { getPrisma } from './test-db.helper';

const DEFAULT_SECRET = 'test-paddle-webhook-secret-for-e2e';

/**
 * Poll the subscription table until a condition is met or timeout expires.
 * Replaces flaky `wait(500)` for async webhook processing.
 */
export async function pollSubscription(
  app: INestApplication,
  filter: { userId?: string; paddleSubscriptionId?: string },
  predicate: (sub: any) => boolean,
  timeoutMs = 5000,
  intervalMs = 100,
): Promise<void> {
  const prisma = getPrisma(app);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const sub = await prisma.subscription.findFirst({ where: filter });
    if (sub && predicate(sub)) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `pollSubscription timed out after ${timeoutMs}ms for filter ${JSON.stringify(filter)}`,
  );
}

/** Compute a valid Paddle webhook signature for the given payload. */
export function buildPaddleSignature(
  rawBody: string,
  secret: string = DEFAULT_SECRET,
  ts: string = String(Math.floor(Date.now() / 1000)),
): string {
  const signedPayload = `${ts}:${rawBody}`;
  const h1 = createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `ts=${ts};h1=${h1}`;
}

/** Build a subscription.created Paddle webhook payload. */
export function buildSubscriptionCreatedPayload(opts: {
  eventId: string;
  userId: string;
  subscriptionId: string;
  customerId: string;
  priceId: string;
}) {
  return {
    event_id: opts.eventId,
    event_type: 'subscription.created',
    data: {
      id: opts.subscriptionId,
      customer_id: opts.customerId,
      custom_data: { userId: opts.userId },
      items: [{ price: { id: opts.priceId } }],
      current_billing_period: {
        ends_at: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      },
    },
  };
}

/** Build a subscription.canceled Paddle webhook payload. */
export function buildSubscriptionCanceledPayload(opts: {
  eventId: string;
  subscriptionId: string;
}) {
  return {
    event_id: opts.eventId,
    event_type: 'subscription.canceled',
    data: {
      id: opts.subscriptionId,
      customer_id: 'cus_test',
    },
  };
}

/** Build a subscription.updated Paddle webhook payload. */
export function buildSubscriptionUpdatedPayload(opts: {
  eventId: string;
  subscriptionId: string;
  priceId?: string;
  scheduledCancel?: boolean;
}) {
  return {
    event_id: opts.eventId,
    event_type: 'subscription.updated',
    data: {
      id: opts.subscriptionId,
      customer_id: 'cus_test',
      items: opts.priceId ? [{ price: { id: opts.priceId } }] : [],
      current_billing_period: {
        ends_at: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      },
      scheduled_change: opts.scheduledCancel
        ? {
            action: 'cancel',
            effective_at: new Date(
              Date.now() + 30 * 24 * 3600_000,
            ).toISOString(),
          }
        : null,
    },
  };
}

/** Build a subscription.past_due Paddle webhook payload. */
export function buildSubscriptionPastDuePayload(opts: {
  eventId: string;
  subscriptionId: string;
}) {
  return {
    event_id: opts.eventId,
    event_type: 'subscription.past_due',
    data: {
      id: opts.subscriptionId,
      customer_id: 'cus_test',
    },
  };
}
