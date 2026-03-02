import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import {
  CategoryInUseError,
  CategoryNotFoundError,
  QuotaExceededError,
  RecommendationNotFoundError,
} from '../common/errors/app.error.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: jest.Mocked<CategoriesRepository>;
  let subscriptionsService: { assertResourceLimit: jest.Mock };
  let mockTx: {
    eventGroup: { count: jest.Mock };
    category: { count: jest.Mock; create: jest.Mock; delete: jest.Mock };
  };

  const userId = 'user-1';

  const mockCategory = {
    id: 'cat-1',
    userId,
    name: 'Work',
    color: '#3B82F6',
    isSystem: false,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    subscriptionsService = {
      assertResourceLimit: jest.fn(),
    };

    mockTx = {
      eventGroup: { count: jest.fn().mockResolvedValue(0) },
      category: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(mockCategory),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countByUserId: jest.fn(),
            countEventGroupsForCategory: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: (tx: any) => Promise<any>) =>
              cb(mockTx),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
    repo = module.get(CategoriesRepository);
  });

  // ─── DELETE CONSTRAINTS ────────────────────────────────────

  describe('delete', () => {
    it('should reject deleting category with chapters (EventGroupInUse)', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockCategory);
      mockTx.eventGroup.count.mockResolvedValue(5);

      await expect(service.delete(userId, 'cat-1')).rejects.toThrow(
        CategoryInUseError,
      );
    });

    it('should allow deleting category with zero chapters', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockCategory);
      mockTx.eventGroup.count.mockResolvedValue(0);
      mockTx.category.delete.mockResolvedValue(undefined);

      await expect(service.delete(userId, 'cat-1')).resolves.toBeUndefined();
      expect(mockTx.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId },
      });
    });

    it('should reject deleting non-existent category', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete(userId, 'nonexistent')).rejects.toThrow(
        CategoryNotFoundError,
      );
    });
  });

  // ─── CREATE ────────────────────────────────────────────────

  describe('create', () => {
    it('should auto-assign order when not provided', async () => {
      mockTx.category.count.mockResolvedValue(3);
      mockTx.category.create.mockResolvedValue({ ...mockCategory, order: 3 });

      await service.create(userId, { name: 'New', color: '#FF0000' });

      expect(mockTx.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 3 }),
        }),
      );
    });

    it('should use provided order when specified', async () => {
      mockTx.category.count.mockResolvedValue(3);
      mockTx.category.create.mockResolvedValue({ ...mockCategory, order: 0 });

      await service.create(userId, { name: 'New', color: '#FF0000', order: 0 });

      expect(mockTx.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });
  });

  // ─── CREATE FROM RECOMMENDATION ────────────────────────────

  describe('createFromRecommendation', () => {
    it('should create category with recommendation color', async () => {
      mockTx.category.count.mockResolvedValue(0);
      mockTx.category.create.mockResolvedValue(mockCategory);

      await service.createFromRecommendation(userId, {
        key: 'work' as any,
        name: 'Work',
      });

      expect(mockTx.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            color: '#3B82F6', // Work recommendation color
          }),
        }),
      );
    });

    it('should reject invalid recommendation key', async () => {
      await expect(
        service.createFromRecommendation(userId, {
          key: 'invalid_key' as any,
          name: 'Bad',
        }),
      ).rejects.toThrow(RecommendationNotFoundError);
    });
  });

  // ─── QUOTA ENFORCEMENT ────────────────────────────────────

  describe('quota enforcement', () => {
    it('should throw QuotaExceededError when at limit on create', async () => {
      mockTx.category.count.mockResolvedValue(5);
      subscriptionsService.assertResourceLimit.mockRejectedValue(
        new QuotaExceededError({
          resource: 'categories',
          current: 5,
          limit: 5,
          tier: 'FREE',
        }),
      );

      await expect(
        service.create(userId, { name: 'Over Limit', color: '#FF0000' }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should throw QuotaExceededError when at limit on createFromRecommendation', async () => {
      mockTx.category.count.mockResolvedValue(5);
      subscriptionsService.assertResourceLimit.mockRejectedValue(
        new QuotaExceededError({
          resource: 'categories',
          current: 5,
          limit: 5,
          tier: 'FREE',
        }),
      );

      await expect(
        service.createFromRecommendation(userId, {
          key: 'work' as any,
          name: 'Work',
        }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should allow create when under limit', async () => {
      mockTx.category.count.mockResolvedValue(3);
      mockTx.category.create.mockResolvedValue(mockCategory);
      subscriptionsService.assertResourceLimit.mockResolvedValue(undefined);

      await expect(
        service.create(userId, { name: 'New', color: '#FF0000' }),
      ).resolves.toBeDefined();

      expect(subscriptionsService.assertResourceLimit).toHaveBeenCalledWith(
        userId,
        'categories',
        3,
      );
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────

  describe('update', () => {
    it('should reject updating non-existent category', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.update(userId, 'nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it('should pass through partial update fields', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockCategory);
      repo.update.mockResolvedValue({ ...mockCategory, name: 'Updated Work' });

      await service.update(userId, 'cat-1', { name: 'Updated Work' });

      expect(repo.update).toHaveBeenCalledWith('cat-1', {
        name: 'Updated Work',
        color: undefined,
        order: undefined,
      });
    });
  });
});
