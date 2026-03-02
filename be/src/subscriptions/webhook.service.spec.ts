import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service.js';
import { WebhookRepository } from './webhook.repository.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionsService } from './subscriptions.service.js';

const makePayload = (
  eventType: string,
  data: Record<string, unknown> = {},
) => ({
  event_id: 'evt_123',
  event_type: eventType,
  data: {
    id: 'sub_abc',
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
  let subscriptionsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    webhookRepo = {
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
      markProcessed: jest.fn().mockResolvedValue(undefined),
    };

    subRepo = {
      updateByUserId: jest.fn().mockResolvedValue(undefined),
      updateByPaddleSubscriptionId: jest
        .fn()
        .mockResolvedValue({ userId: 'user-1' }),
    };

    subscriptionsService = {
      invalidateTierCache: jest.fn(),
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
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(WebhookService);
  });

  // ─── Idempotency ──────────────────────────────────────────

  it('should skip already processed events (P2002 + findById processed=true)', async () => {
    // Simulate: create throws P2002 (already stored), findById returns processed=true
    const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    webhookRepo.create.mockRejectedValue(p2002);
    webhookRepo.findById.mockResolvedValue({ id: 'evt_123', processed: true });

    await service.handleEvent(makePayload('subscription.created'));

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
    expect(webhookRepo.markProcessed).not.toHaveBeenCalled();
  });

  it('should not re-create event if it already exists but unprocessed (P2002)', async () => {
    // Simulate: create throws P2002 (already stored), findById returns processed=false
    const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    webhookRepo.create.mockRejectedValue(p2002);
    webhookRepo.findById.mockResolvedValue({
      id: 'evt_123',
      processed: false,
    });

    await service.handleEvent(makePayload('subscription.created'));

    expect(webhookRepo.create).toHaveBeenCalledTimes(1);
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

  // ─── subscription.resumed ────────────────────────────────

  it('should handle subscription.resumed', async () => {
    await service.handleEvent(makePayload('subscription.resumed'));

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      {
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2026-04-01T00:00:00Z'),
        canceledAt: null,
      },
    );
  });

  it('should handle subscription.resumed without billing period', async () => {
    await service.handleEvent(
      makePayload('subscription.resumed', {
        current_billing_period: {},
      }),
    );

    expect(subRepo.updateByPaddleSubscriptionId).toHaveBeenCalledWith(
      'sub_abc',
      {
        status: 'ACTIVE',
        currentPeriodEnd: null,
        canceledAt: null,
      },
    );
  });

  // ─── subscription.trialing ──────────────────────────────

  it('should handle subscription.trialing', async () => {
    await service.handleEvent(makePayload('subscription.trialing'));

    expect(subRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      tier: 'PRO',
      status: 'TRIALING',
      paddleCustomerId: 'ctm_xyz',
      paddleSubscriptionId: 'sub_abc',
      currentPeriodEnd: new Date('2026-04-01T00:00:00Z'),
      canceledAt: null,
    });
  });

  it('should skip subscription.trialing without userId', async () => {
    await service.handleEvent(
      makePayload('subscription.trialing', { custom_data: {} }),
    );

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
  });

  it('should throw for subscription.trialing with unknown price ID', async () => {
    await expect(
      service.handleEvent(
        makePayload('subscription.trialing', {
          items: [{ price: { id: 'pri_unknown' } }],
        }),
      ),
    ).rejects.toThrow('Unknown price ID: pri_unknown');
  });

  // ─── subscription.imported ──────────────────────────────

  it('should handle subscription.imported same as created', async () => {
    await service.handleEvent(makePayload('subscription.imported'));

    expect(subRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      tier: 'PRO',
      status: 'ACTIVE',
      paddleCustomerId: 'ctm_xyz',
      paddleSubscriptionId: 'sub_abc',
      currentPeriodEnd: new Date('2026-04-01T00:00:00Z'),
      canceledAt: null,
    });
  });

  // ─── Edge cases ───────────────────────────────────────────

  it('should skip subscription.created without userId', async () => {
    await service.handleEvent(
      makePayload('subscription.created', { custom_data: {} }),
    );

    expect(subRepo.updateByUserId).not.toHaveBeenCalled();
  });

  it('should throw for subscription.created with unknown price ID', async () => {
    await expect(
      service.handleEvent(
        makePayload('subscription.created', {
          items: [{ price: { id: 'pri_unknown' } }],
        }),
      ),
    ).rejects.toThrow('Unknown price ID: pri_unknown');
  });

  it('should handle unknown event type gracefully', async () => {
    await expect(
      service.handleEvent(makePayload('transaction.completed')),
    ).resolves.toBeUndefined();

    expect(webhookRepo.markProcessed).toHaveBeenCalledWith('evt_123');
  });
});
