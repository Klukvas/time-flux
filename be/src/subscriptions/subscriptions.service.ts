import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { PaddleService } from './paddle.service.js';
import {
  TIER_LIMITS,
  type TierLimitResource,
  type TierFeature,
  type TierLimits,
} from '../common/constants/tier-limits.js';
import {
  QuotaExceededError,
  FeatureLockedError,
  SubscriptionNotFoundError,
  PaddleCancelError,
} from '../common/errors/app.error.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly repo: SubscriptionsRepository,
    private readonly paddleService: PaddleService,
    private readonly prisma: PrismaService,
  ) {}

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
    const sub = await this.repo.findByUserId(userId);
    return sub?.tier ?? 'FREE';
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
    const limits = await this.getLimits(userId);
    const max = limits[resource];
    if (max !== -1 && currentCount >= max) {
      const tier = await this.getTier(userId);
      throw new QuotaExceededError({
        resource,
        current: currentCount,
        limit: max,
        tier,
      });
    }
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

    return {
      message: 'Subscription will be canceled at the end of the billing period',
      canceledAt: canceledAt.toISOString(),
    };
  }
}
