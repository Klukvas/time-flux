import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import {
  CategoryInUseError,
  CategoryNotFoundError,
  RecommendationNotFoundError,
} from '../common/errors/app.error.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: jest.Mocked<CategoriesRepository>;

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
      ],
    }).compile();

    service = module.get(CategoriesService);
    repo = module.get(CategoriesRepository);
  });

  // ─── DELETE CONSTRAINTS ────────────────────────────────────

  describe('delete', () => {
    it('should reject deleting category with chapters (EventGroupInUse)', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockCategory);
      repo.countEventGroupsForCategory.mockResolvedValue(5);

      await expect(service.delete(userId, 'cat-1')).rejects.toThrow(CategoryInUseError);
    });

    it('should allow deleting category with zero chapters', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockCategory);
      repo.countEventGroupsForCategory.mockResolvedValue(0);
      repo.delete.mockResolvedValue(undefined as any);

      await expect(service.delete(userId, 'cat-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('cat-1');
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
      repo.countByUserId.mockResolvedValue(3);
      repo.create.mockResolvedValue({ ...mockCategory, order: 3 });

      await service.create(userId, { name: 'New', color: '#FF0000' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 3 }),
      );
    });

    it('should use provided order when specified', async () => {
      repo.countByUserId.mockResolvedValue(3);
      repo.create.mockResolvedValue({ ...mockCategory, order: 0 });

      await service.create(userId, { name: 'New', color: '#FF0000', order: 0 });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0 }),
      );
    });
  });

  // ─── CREATE FROM RECOMMENDATION ────────────────────────────

  describe('createFromRecommendation', () => {
    it('should create category with recommendation color', async () => {
      repo.countByUserId.mockResolvedValue(0);
      repo.create.mockResolvedValue(mockCategory);

      await service.createFromRecommendation(userId, { key: 'work' as any, name: 'Work' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#3B82F6', // Work recommendation color
        }),
      );
    });

    it('should reject invalid recommendation key', async () => {
      await expect(
        service.createFromRecommendation(userId, { key: 'invalid_key' as any, name: 'Bad' }),
      ).rejects.toThrow(RecommendationNotFoundError);
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
