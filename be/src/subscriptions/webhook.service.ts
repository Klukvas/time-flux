import { Injectable, Logger } from '@nestjs/common';
import { WebhookRepository } from './webhook.repository.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { buildPriceToTierMap, tierFromPriceId } from './paddle-price-map.js';
import { ConfigService } from '@nestjs/config';

interface PaddleSubscriptionEvent {
  id: string;
  customer_id: string;
  custom_data?: { userId?: string };
  items?: Array<{ price?: { id: string } }>;
  current_billing_period?: { ends_at?: string };
  scheduled_change?: { action?: string; effective_at?: string } | null;
}

interface PaddleWebhookPayload {
  event_id: string;
  event_type: string;
  data: PaddleSubscriptionEvent;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly priceToTier: ReadonlyMap<string, 'PRO' | 'PREMIUM'>;

  constructor(
    private readonly webhookRepo: WebhookRepository,
    private readonly subscriptionRepo: SubscriptionsRepository,
    private readonly subscriptionsService: SubscriptionsService,
    config: ConfigService,
  ) {
    this.priceToTier = buildPriceToTierMap(config);
  }

  async handleEvent(payload: PaddleWebhookPayload): Promise<void> {
    const { event_id, event_type, data } = payload;

    // Atomic idempotency: attempt insert, treat unique violation as "already exists"
    try {
      await this.webhookRepo.create(event_id, event_type, payload);
    } catch (error: any) {
      // P2002 = Prisma unique constraint violation → event already stored
      if (error?.code === 'P2002') {
        const existing = await this.webhookRepo.findById(event_id);
        if (existing?.processed) {
          this.logger.log(`Skipping already processed event ${event_id}`);
          return;
        }
        // Not yet processed — continue to processEvent below
      } else {
        throw error;
      }
    }

    try {
      await this.processEvent(event_type, data);
    } finally {
      await this.webhookRepo.markProcessed(event_id);
    }
  }

  private async processEvent(
    eventType: string,
    data: PaddleSubscriptionEvent,
  ): Promise<void> {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated':
        await this.handleCreatedOrActivated(data);
        break;
      case 'subscription.updated':
        await this.handleUpdated(data);
        break;
      case 'subscription.canceled':
        await this.handleCanceled(data);
        break;
      case 'subscription.past_due':
        await this.handlePastDue(data);
        break;
      case 'subscription.paused':
        await this.handlePaused(data);
        break;
      case 'subscription.resumed':
        await this.handleResumed(data);
        break;
      case 'subscription.trialing':
        await this.handleTrialing(data);
        break;
      case 'subscription.imported':
        await this.handleCreatedOrActivated(data);
        break;
      default:
        this.logger.warn(`Unhandled event type: ${eventType}`);
    }
  }

  private async handleCreatedOrActivated(
    data: PaddleSubscriptionEvent,
  ): Promise<void> {
    const userId = data.custom_data?.userId;
    if (!userId) {
      this.logger.error('subscription.created missing custom_data.userId');
      return;
    }

    const priceId = data.items?.[0]?.price?.id;
    const tier = priceId
      ? tierFromPriceId(this.priceToTier, priceId)
      : undefined;

    if (!tier) {
      throw new Error(`Unknown price ID: ${priceId}`);
    }

    const periodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : null;

    await this.subscriptionRepo.updateByUserId(userId, {
      tier,
      status: 'ACTIVE',
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.id,
      currentPeriodEnd: periodEnd,
      canceledAt: null,
    });
    this.subscriptionsService.invalidateTierCache(userId);

    this.logger.log(`Subscription activated for user ${userId}: ${tier}`);
  }

  private async handleUpdated(data: PaddleSubscriptionEvent): Promise<void> {
    const priceId = data.items?.[0]?.price?.id;
    const tier = priceId
      ? tierFromPriceId(this.priceToTier, priceId)
      : undefined;

    const periodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : null;

    const canceledAt =
      data.scheduled_change?.action === 'cancel' &&
      data.scheduled_change?.effective_at
        ? new Date(data.scheduled_change.effective_at)
        : null;

    const updateData: Record<string, unknown> = {
      currentPeriodEnd: periodEnd,
    };
    if (tier) updateData.tier = tier;
    if (canceledAt) updateData.canceledAt = canceledAt;

    const updated = await this.subscriptionRepo.updateByPaddleSubscriptionId(
      data.id,
      updateData as Parameters<
        typeof this.subscriptionRepo.updateByPaddleSubscriptionId
      >[1],
    );
    this.subscriptionsService.invalidateTierCache(updated.userId);

    this.logger.log(
      `Subscription updated: ${data.id}${tier ? ` → ${tier}` : ''}`,
    );
  }

  private async handleCanceled(data: PaddleSubscriptionEvent): Promise<void> {
    const updated = await this.subscriptionRepo.updateByPaddleSubscriptionId(
      data.id,
      {
        tier: 'FREE',
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    );
    this.subscriptionsService.invalidateTierCache(updated.userId);
    this.logger.log(`Subscription canceled: ${data.id}`);
  }

  private async handlePastDue(data: PaddleSubscriptionEvent): Promise<void> {
    const updated = await this.subscriptionRepo.updateByPaddleSubscriptionId(
      data.id,
      {
        status: 'PAST_DUE',
      },
    );
    this.subscriptionsService.invalidateTierCache(updated.userId);
    this.logger.log(`Subscription past due: ${data.id}`);
  }

  private async handlePaused(data: PaddleSubscriptionEvent): Promise<void> {
    const updated = await this.subscriptionRepo.updateByPaddleSubscriptionId(
      data.id,
      {
        status: 'PAUSED',
      },
    );
    this.subscriptionsService.invalidateTierCache(updated.userId);
    this.logger.log(`Subscription paused: ${data.id}`);
  }

  private async handleResumed(data: PaddleSubscriptionEvent): Promise<void> {
    const periodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : null;

    const updated = await this.subscriptionRepo.updateByPaddleSubscriptionId(
      data.id,
      {
        status: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      },
    );
    this.subscriptionsService.invalidateTierCache(updated.userId);
    this.logger.log(`Subscription resumed: ${data.id}`);
  }

  private async handleTrialing(data: PaddleSubscriptionEvent): Promise<void> {
    const userId = data.custom_data?.userId;
    if (!userId) {
      this.logger.error('subscription.trialing missing custom_data.userId');
      return;
    }

    const priceId = data.items?.[0]?.price?.id;
    const tier = priceId
      ? tierFromPriceId(this.priceToTier, priceId)
      : undefined;

    if (!tier) {
      throw new Error(`Unknown price ID: ${priceId}`);
    }

    const periodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : null;

    await this.subscriptionRepo.updateByUserId(userId, {
      tier,
      status: 'TRIALING',
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.id,
      currentPeriodEnd: periodEnd,
      canceledAt: null,
    });
    this.subscriptionsService.invalidateTierCache(userId);

    this.logger.log(`Subscription trialing for user ${userId}: ${tier}`);
  }
}
