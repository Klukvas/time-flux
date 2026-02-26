import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service.js';
import { WebhookRepository } from './webhook.repository.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';

const makePayload = (
  eventType: string,
  data: Record<string, unknown> = {},
) => ({
  event_id: 'evt_123',
  event_type: eventType,
  data: {
    subscription_id: 'sub_abc',
    customer_id: 'ctm_xyz',
    custom_data: { userId: 'user-1' },
    items: [{ price: { id: 'pri_pro' } }],
    current_billing_period: { ends_at: '2026-04-01T00:00:00Z' },
    ...data,
  },
});

describe('WebhookService', () => {
  let service: WebhookService;
  let webhookRepo: Record<string, jest.Mock>;
  let subRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    webhookRepo = {
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
      markProcessed: jest.fn().mockResolvedValue(undefined),
    };

    subRepo = {
      updateByUserId: jest.fn().mockResolvedValue(undefined),
      updateByPaddleSubscriptionId: jest.fn().mockResolvedValue(undefined),
    };

    const config = {
      get: (key: string) => {
        const env: Record<string, string> = {
          PADDLE_PRO_PRICE_ID: 'pri_pro',
          PADDLE_PREMIUM_PRICE_ID: 'pri_premium',
        };
        return env[key];
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: WebhookRepository, useValue: webhookRepo },
        { provide: SubscriptionsRepository, useValue: subRepo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(WebhookService);
  });

  // ─── Idempotency ──────────────────────────────────────────

  it('should skip already processed events', async () => {
    webhookRepo.findById.mockResolvedValue({ id: 'evt_123', processed: true });

    await service.handleEvent(makePayload('subscription.created'));

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
    expect(webhookRepo.markProcessed).not.toHaveBeenCalled();
  });

  it('should not re-create event if it already exists but unprocessed', async () => {
    webhookRepo.findById.mockResolvedValue({
      id: 'evt_123',
      processed: false,
    });

    await service.handleEvent(makePayload('subscription.created'));

    expect(webhookRepo.create).not.toHaveBeenCalled();
    expect(subRepo.updateByUserId).toHaveBeenCalled();
    expect(webhookRepo.markProcessed).toHaveBeenCalledWith('evt_123');
  });

  // ─── subscription.created ─────────────────────────────────

  it('should handle subscription.created', async () => {
    await service.handleEvent(makePayload('subscription.created'));

    expect(webhookRepo.create).toHaveBeenCalledWith(
      'evt_123',
      'subscription.created',
      expect.any(Object),
    );

    expect(subRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      tier: 'PRO',
      status: 'ACTIVE',
      paddleCustomerId: 'ctm_xyz',
      paddleSubscriptionId: 'sub_abc',
      currentPeriodEnd: new Date('2026-04-01T00:00:00Z'),
      canceledAt: null,
    });

    expect(webhookRepo.markProcessed).toHaveBeenCalledWith('evt_123');
  });

  // ─── subscription.activated ───────────────────────────────

  it('should handle subscription.activated same as created', async () => {
    await service.handleEvent(makePayload('subscription.activated'));

    expect(subRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      tier: 'PRO',
      status: 'ACTIVE',
      paddleCustomerId: 'ctm_xyz',
      paddleSubscriptionId: 'sub_abc',
      currentPeriodEnd: new Date('2026-04-01T00:00:00Z'),
      canceledAt: null,
    });
  });

  // ─── subscription.updated ─────────────────────────────────

  it('should handle subscription.updated with tier change', async () => {
    await service.handleEvent(
      makePayload('subscription.updated', {
        items: [{ price: { id: 'pri_premium' } }],
      }),
    );

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({ tier: 'PREMIUM' }),
    );
  });

  it('should handle subscription.updated with scheduled cancel', async () => {
    await service.handleEvent(
      makePayload('subscription.updated', {
        scheduled_change: {
          action: 'cancel',
          effective_at: '2026-05-01T00:00:00Z',
        },
      }),
    );

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({
        canceledAt: new Date('2026-05-01T00:00:00Z'),
      }),
    );
  });

  // ─── subscription.canceled ────────────────────────────────

  it('should handle subscription.canceled', async () => {
    await service.handleEvent(makePayload('subscription.canceled'));

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({
        tier: 'FREE',
        status: 'CANCELED',
      }),
    );
  });

  // ─── subscription.past_due ────────────────────────────────

  it('should handle subscription.past_due', async () => {
    await service.handleEvent(makePayload('subscription.past_due'));

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      { status: 'PAST_DUE' },
    );
  });

  // ─── subscription.paused ──────────────────────────────────

  it('should handle subscription.paused', async () => {
    await service.handleEvent(makePayload('subscription.paused'));

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      { status: 'PAUSED' },
    );
  });

  // ─── Edge cases ───────────────────────────────────────────

  it('should skip subscription.created without userId', async () => {
    await service.handleEvent(
      makePayload('subscription.created', { custom_data: {} }),
    );

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
  });

  it('should skip subscription.created with unknown price ID', async () => {
    await service.handleEvent(
      makePayload('subscription.created', {
        items: [{ price: { id: 'pri_unknown' } }],
      }),
    );

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
  });

  it('should handle unknown event type gracefully', async () => {
    await expect(
      service.handleEvent(makePayload('transaction.completed')),
    ).resolves.toBeUndefined();

    expect(webhookRepo.markProcessed).toHaveBeenCalledWith('evt_123');
  });
});
