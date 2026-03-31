import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { PaddleService } from './paddle.service.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  QuotaExceededError,
  FeatureLockedError,
  SubscriptionNotFoundError,
  PaddleCancelError,
} from '../common/errors/app.error.js';

const USER_ID = 'user-1';

const makeSub = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  userId: USER_ID,
  tier: 'FREE' as const,
  status: 'ACTIVE' as const,
  paddleCustomerId: null,
  paddleSubscriptionId: null,
  currentPeriodEnd: null,
  canceledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repo: Record<string, jest.Mock>;
  let paddleService: Record<string, jest.Mock | boolean>;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      findByUserId: jest.fn(),
      createFree: jest.fn(),
      upsertFree: jest.fn(),
      updateByUserId: jest.fn(),
      updateByPaddleSubscriptionId: jest.fn(),
      findByPaddleCustomerId: jest.fn(),
    };

    paddleService = {
      isEnabled: true,
      cancelSubscription: jest.fn().mockResolvedValue(undefined),
      getSubscription: jest.fn(),
    };

    prisma = {
      dayMedia: { count: jest.fn().mockResolvedValue(10) },
      eventGroup: { count: jest.fn().mockResolvedValue(2) },
      category: { count: jest.fn().mockResolvedValue(3) },
      dayState: { count: jest.fn().mockResolvedValue(5) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: repo },
        { provide: PaddleService, useValue: paddleService },
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                PADDLE_PRO_PRICE_ID: 'pri_pro_test',
                PADDLE_PREMIUM_PRICE_ID: 'pri_premium_test',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  // ─── getSubscription ───────────────────────────────────────

  describe('getSubscription', () => {
    it('should return existing subscription with limits and usage', async () => {
      repo.upsertFree.mockResolvedValue(makeSub({ tier: 'PRO' }));

      const result = await service.getSubscription(USER_ID);

      expect(repo.upsertFree).toHaveBeenCalledWith(USER_ID);
      expect(result.tier).toBe('PRO');
      expect(result.limits.media).toBe(500);
      expect(result.limits.analytics).toBe(true);
      expect(result.limits.memories).toBe(false);
      expect(result.usage).toEqual({
        media: 10,
        chapters: 2,
        categories: 3,
        dayStates: 5,
      });
    });

    it('should upsert FREE subscription atomically', async () => {
      repo.upsertFree.mockResolvedValue(makeSub());

      const result = await service.getSubscription(USER_ID);

      expect(repo.upsertFree).toHaveBeenCalledWith(USER_ID);
      expect(result.tier).toBe('FREE');
      expect(result.limits.media).toBe(50);
      expect(result.limits.analytics).toBe('basic');
    });

    it('should return correct limits for PREMIUM tier', async () => {
      repo.upsertFree.mockResolvedValue(makeSub({ tier: 'PREMIUM' }));

      const result = await service.getSubscription(USER_ID);

      expect(result.limits.media).toBe(-1);
      expect(result.limits.chapters).toBe(-1);
      expect(result.limits.analytics).toBe(true);
      expect(result.limits.memories).toBe(true);
    });
  });

  // ─── getTier ───────────────────────────────────────────────

  describe('getTier', () => {
    it('should return tier from subscription', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PRO' }));

      expect(await service.getTier(USER_ID)).toBe('PRO');
    });

    it('should default to FREE when no subscription', async () => {
      repo.findByUserId.mockResolvedValue(null);

      expect(await service.getTier(USER_ID)).toBe('FREE');
    });
  });

  // ─── assertResourceLimit ──────────────────────────────────

  describe('assertResourceLimit', () => {
    it('should allow when under limit', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertResourceLimit(USER_ID, 'media', 30),
      ).resolves.toBeUndefined();
    });

    it('should throw QuotaExceededError when at limit', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertResourceLimit(USER_ID, 'media', 50),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should throw QuotaExceededError when over limit', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertResourceLimit(USER_ID, 'categories', 5),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should include details in QuotaExceededError', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertResourceLimit(USER_ID, 'chapters', 5),
      ).rejects.toMatchObject({
        errorCode: 'QUOTA_EXCEEDED',
        details: { resource: 'chapters', current: 5, limit: 5, tier: 'FREE' },
      });
    });

    it('should allow unlimited (-1) for PREMIUM tier', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PREMIUM' }));

      await expect(
        service.assertResourceLimit(USER_ID, 'media', 10000),
      ).resolves.toBeUndefined();
    });

    it('should respect PRO tier limits', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PRO' }));

      // 29 chapters is under PRO limit of 30
      await expect(
        service.assertResourceLimit(USER_ID, 'chapters', 29),
      ).resolves.toBeUndefined();

      // 30 chapters is at PRO limit
      await expect(
        service.assertResourceLimit(USER_ID, 'chapters', 30),
      ).rejects.toThrow(QuotaExceededError);
    });
  });

  // ─── getAnalyticsAccessLevel ─────────────────────────────

  describe('getAnalyticsAccessLevel', () => {
    it('should return "basic" for FREE tier', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      expect(await service.getAnalyticsAccessLevel(USER_ID)).toBe('basic');
    });

    it('should return true for PRO tier', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PRO' }));

      expect(await service.getAnalyticsAccessLevel(USER_ID)).toBe(true);
    });

    it('should return true for PREMIUM tier', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PREMIUM' }));

      expect(await service.getAnalyticsAccessLevel(USER_ID)).toBe(true);
    });
  });

  // ─── assertFeatureAccess ──────────────────────────────────

  describe('assertFeatureAccess', () => {
    it('should allow analytics (basic) on FREE — no longer locked', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertFeatureAccess(USER_ID, 'analytics'),
      ).resolves.toBeUndefined();
    });

    it('should allow analytics for PRO', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PRO' }));

      await expect(
        service.assertFeatureAccess(USER_ID, 'analytics'),
      ).resolves.toBeUndefined();
    });

    it('should throw FeatureLockedError for memories on PRO', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PRO' }));

      await expect(
        service.assertFeatureAccess(USER_ID, 'memories'),
      ).rejects.toThrow(FeatureLockedError);
    });

    it('should allow memories for PREMIUM', async () => {
      repo.findByUserId.mockResolvedValue(makeSub({ tier: 'PREMIUM' }));

      await expect(
        service.assertFeatureAccess(USER_ID, 'memories'),
      ).resolves.toBeUndefined();
    });

    it('should include details in FeatureLockedError', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(
        service.assertFeatureAccess(USER_ID, 'memories'),
      ).rejects.toMatchObject({
        errorCode: 'FEATURE_LOCKED',
        details: { feature: 'memories', tier: 'FREE' },
      });
    });
  });

  // ─── cancelSubscription ─────────────────────────────────

  describe('cancelSubscription', () => {
    it('should call Paddle and set canceledAt', async () => {
      repo.findByUserId.mockResolvedValue(
        makeSub({ paddleSubscriptionId: 'sub_abc' }),
      );
      repo.updateByUserId.mockResolvedValue(undefined);

      const result = await service.cancelSubscription(USER_ID);

      expect(paddleService.cancelSubscription).toHaveBeenCalledWith('sub_abc');
      expect(repo.updateByUserId).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ canceledAt: expect.any(Date) }),
      );
      expect(result.message).toContain('canceled');
      expect(result.canceledAt).toBeDefined();
    });

    it('should throw SubscriptionNotFoundError when no subscription', async () => {
      repo.findByUserId.mockResolvedValue(null);

      await expect(service.cancelSubscription(USER_ID)).rejects.toThrow(
        SubscriptionNotFoundError,
      );
    });

    it('should throw SubscriptionNotFoundError when no paddleSubscriptionId', async () => {
      repo.findByUserId.mockResolvedValue(makeSub());

      await expect(service.cancelSubscription(USER_ID)).rejects.toThrow(
        SubscriptionNotFoundError,
      );
    });

    it('should throw PaddleCancelError when Paddle API fails', async () => {
      repo.findByUserId.mockResolvedValue(
        makeSub({ paddleSubscriptionId: 'sub_abc' }),
      );
      (paddleService.cancelSubscription as jest.Mock).mockRejectedValue(
        new Error('Paddle API error'),
      );

      await expect(service.cancelSubscription(USER_ID)).rejects.toThrow(
        PaddleCancelError,
      );
    });
  });
});
