import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { PaddleService } from './paddle.service.js';
import {
  TIER_LIMITS,
  type TierLimitResource,
  type TierFeature,
  type TierLimits,
  type AnalyticsAccess,
} from '../common/constants/tier-limits.js';
import {
  QuotaExceededError,
  FeatureLockedError,
  SubscriptionNotFoundError,
  PaddleCancelError,
  PaddleUpgradeError,
  InvalidUpgradeError,
} from '../common/errors/app.error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { buildTierToPriceMap } from './paddle-price-map.js';

const TIER_CACHE_TTL_MS = 60_000;

const TIER_ORDER: Record<string, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };
const UPGRADEABLE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

interface TierCacheEntry {
  readonly tier: string;
  readonly expiresAt: number;
}

interface PriceInfo {
  readonly tier: string;
  readonly amount: string;
  readonly currency: string;
  readonly interval: string;
}

interface PricesCache {
  readonly data: PriceInfo[];
  readonly expiresAt: number;
}

const PRICES_CACHE_TTL_MS = 3_600_000; // 1 hour

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly tierCache = new Map<string, TierCacheEntry>();
  private readonly tierToPriceMap: ReadonlyMap<'PRO' | 'PREMIUM', string>;
  private pricesCache: PricesCache | null = null;

  constructor(
    private readonly repo: SubscriptionsRepository,
    private readonly paddleService: PaddleService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.tierToPriceMap = buildTierToPriceMap(config);
  }

  async getPrices(): Promise<PriceInfo[]> {
    if (this.pricesCache && this.pricesCache.expiresAt > Date.now()) {
      return this.pricesCache.data;
    }

    const entries = Array.from(this.tierToPriceMap.entries());
    const prices = await Promise.all(
      entries.map(async ([tier, priceId]) => {
        const price = await this.paddleService.getPrice(priceId);
        return {
          tier,
          amount: price.unitPrice.amount,
          currency: price.unitPrice.currencyCode,
          interval: price.billingCycle
            ? `${price.billingCycle.interval}`
            : 'one-time',
        };
      }),
    );

    this.pricesCache = {
      data: prices,
      expiresAt: Date.now() + PRICES_CACHE_TTL_MS,
    };

    return prices;
  }

  invalidateTierCache(userId: string): void {
    this.tierCache.delete(userId);
  }

  async getSubscription(userId: string) {
    const sub = await this.repo.upsertFree(userId);
    const limits = TIER_LIMITS[sub.tier] ?? TIER_LIMITS.FREE;

    const [media, chapters, categories, dayStates] = await Promise.all([
      this.prisma.dayMedia.count({ where: { userId } }),
      this.prisma.eventGroup.count({ where: { userId } }),
      this.prisma.category.count({ where: { userId } }),
      this.prisma.dayState.count({ where: { userId } }),
    ]);

    return {
      ...sub,
      limits,
      usage: { media, chapters, categories, dayStates },
    };
  }

  async getTier(userId: string): Promise<string> {
    const cached = this.tierCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tier;
    }

    const sub = await this.repo.findByUserId(userId);
    const tier = sub?.tier ?? 'FREE';

    this.tierCache.set(userId, {
      tier,
      expiresAt: Date.now() + TIER_CACHE_TTL_MS,
    });

    return tier;
  }

  async getLimits(userId: string): Promise<TierLimits> {
    const tier = await this.getTier(userId);
    return TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;
  }

  /**
   * Check resource limit using a count callback that runs inside the caller's
   * transaction context. This avoids TOCTOU race conditions by letting the
   * caller pass a fresh count obtained within the same transaction.
   *
   * For non-transactional callers the `currentCount` overload is still
   * available — pass a plain number.
   */
  async assertResourceLimit(
    userId: string,
    resource: TierLimitResource,
    currentCount: number,
  ) {
    const tier = await this.getTier(userId);
    const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;
    const max = limits[resource];
    if (max !== -1 && currentCount >= max) {
      throw new QuotaExceededError({
        resource,
        current: currentCount,
        limit: max,
        tier,
      });
    }
  }

  async getAnalyticsAccessLevel(userId: string): Promise<AnalyticsAccess> {
    const limits = await this.getLimits(userId);
    return limits.analytics;
  }

  async assertFeatureAccess(userId: string, feature: TierFeature) {
    const limits = await this.getLimits(userId);
    if (!limits[feature]) {
      const tier = await this.getTier(userId);
      throw new FeatureLockedError({ feature, tier });
    }
  }

  async cancelSubscription(userId: string) {
    const sub = await this.repo.findByUserId(userId);
    if (!sub || !sub.paddleSubscriptionId) {
      throw new SubscriptionNotFoundError();
    }

    try {
      await this.paddleService.cancelSubscription(sub.paddleSubscriptionId);
    } catch (err) {
      this.logger.error(`Paddle cancel failed: ${(err as Error).message}`);
      throw new PaddleCancelError();
    }

    // Optimistically set canceledAt — webhook will confirm
    const canceledAt = new Date();
    await this.repo.updateByUserId(userId, { canceledAt });
    this.invalidateTierCache(userId);

    return {
      message: 'Subscription will be canceled at the end of the billing period',
      canceledAt: canceledAt.toISOString(),
    };
  }

  async reactivateSubscription(userId: string) {
    const sub = await this.repo.findByUserId(userId);
    if (!sub || !sub.paddleSubscriptionId) {
      throw new SubscriptionNotFoundError();
    }

    if (!sub.canceledAt) {
      throw new InvalidUpgradeError({
        reason: 'Subscription is not canceled',
      });
    }

    try {
      await this.paddleService.clearScheduledChange(sub.paddleSubscriptionId);
    } catch (err) {
      this.logger.error('Paddle reactivation failed', err);
      throw new PaddleUpgradeError({
        paddleMessage: (err as Error).message,
      });
    }

    await this.repo.updateByUserId(userId, { canceledAt: null });
    this.invalidateTierCache(userId);

    return { message: 'Subscription reactivated' };
  }

  async changePlan(userId: string, targetTier: 'PRO' | 'PREMIUM') {
    const sub = await this.repo.findByUserId(userId);
    if (!sub || !sub.paddleSubscriptionId) {
      throw new SubscriptionNotFoundError();
    }

    // Only ACTIVE or TRIALING subscriptions can change plan
    if (!UPGRADEABLE_STATUSES.has(sub.status)) {
      throw new InvalidUpgradeError({
        currentStatus: sub.status,
        reason: `Cannot change plan for a subscription in ${sub.status} status`,
      });
    }

    // Cannot switch to the same tier
    const currentOrder = TIER_ORDER[sub.tier] ?? 0;
    const targetOrder = TIER_ORDER[targetTier] ?? 0;
    if (targetOrder === currentOrder) {
      throw new InvalidUpgradeError({
        currentTier: sub.tier,
        targetTier,
        reason: 'Already on this tier',
      });
    }

    const priceId = this.tierToPriceMap.get(targetTier);
    if (!priceId) {
      throw new InvalidUpgradeError({
        targetTier,
        reason: 'Price ID not configured for target tier',
      });
    }

    // Upgrade → charge difference now; Downgrade → apply at next billing cycle
    const isUpgrade = targetOrder > currentOrder;
    const prorationMode = isUpgrade
      ? 'prorated_immediately'
      : 'prorated_next_billing_period';

    // If subscription has a pending cancellation, clear it first.
    // (Paddle doesn't allow combining scheduledChange with other fields.)
    // Separate try/catch so DB stays consistent with Paddle on partial failure.
    if (sub.canceledAt) {
      try {
        await this.paddleService.clearScheduledChange(sub.paddleSubscriptionId);
        await this.repo.updateByUserId(userId, { canceledAt: null });
      } catch (err) {
        this.logger.error('Paddle clear-scheduled-change failed', err);
        throw new PaddleUpgradeError({
          paddleMessage: (err as Error).message,
        });
      }
    }

    try {
      await this.paddleService.updateSubscription(
        sub.paddleSubscriptionId,
        priceId,
        prorationMode,
      );
    } catch (err) {
      this.logger.error('Paddle plan change failed', err);
      throw new PaddleUpgradeError({
        paddleMessage: (err as Error).message,
      });
    }

    if (isUpgrade) {
      // Upgrade takes effect immediately — safe to update tier now.
      // Webhook will confirm.
      await this.repo.updateByUserId(userId, {
        tier: targetTier,
        canceledAt: null,
      });
    } else {
      // Downgrade takes effect at next billing cycle.
      // Keep current tier until webhook confirms the actual change.
      await this.repo.updateByUserId(userId, { canceledAt: null });
    }
    this.invalidateTierCache(userId);

    return {
      message: isUpgrade
        ? `Subscription upgraded to ${targetTier}`
        : `Subscription will downgrade to ${targetTier} at the end of the billing period`,
      tier: targetTier,
    };
  }
}
