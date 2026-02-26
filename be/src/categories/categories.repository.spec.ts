import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository } from './categories.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CategoriesRepository', () => {
  let repo: CategoriesRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      eventGroup: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(CategoriesRepository);
  });

  // ─── findAllByUserId ────────────────────────────────────────

  describe('findAllByUserId', () => {
    it('should call prisma.category.findMany with userId and order by order asc', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Work' },
        { id: 'cat-2', name: 'Personal' },
      ];
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await repo.findAllByUserId('user-1');

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array when user has no categories', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await repo.findAllByUserId('user-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── findByIdAndUserId ──────────────────────────────────────

  describe('findByIdAndUserId', () => {
    it('should call prisma.category.findFirst with id and userId', async () => {
      const mockCategory = { id: 'cat-1', userId: 'user-1', name: 'Work' };
      prisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await repo.findByIdAndUserId('cat-1', 'user-1');

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category does not belong to user', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndUserId('cat-1', 'wrong-user');

      expect(result).toBeNull();
    });
  });

  // ─── create ─────────────────────────────────────────────────

  describe('create', () => {
    it('should call prisma.category.create with all provided data', async () => {
      const createData = {
        userId: 'user-1',
        name: 'Health',
        color: '#00FF00',
        order: 3,
        isSystem: false,
      };
      const mockCategory = { id: 'cat-new', ...createData };
      prisma.category.create.mockResolvedValue(mockCategory);

      const result = await repo.create(createData);

      expect(prisma.category.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockCategory);
    });

    it('should call prisma.category.create with minimal required data', async () => {
      const createData = { userId: 'user-1', name: 'Health', color: '#00FF00' };
      prisma.category.create.mockResolvedValue({
        id: 'cat-new',
        ...createData,
      });

      await repo.create(createData);

      expect(prisma.category.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  // ─── update ─────────────────────────────────────────────────

  describe('update', () => {
    it('should call prisma.category.update with correct id and data', async () => {
      const updateData = { name: 'Updated Name', color: '#FF0000' };
      const mockCategory = { id: 'cat-1', ...updateData };
      prisma.category.update.mockResolvedValue(mockCategory);

      const result = await repo.update('cat-1', updateData);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: updateData,
      });
      expect(result).toEqual(mockCategory);
    });

    it('should call prisma.category.update with partial data', async () => {
      prisma.category.update.mockResolvedValue({ id: 'cat-1' });

      await repo.update('cat-1', { order: 2 });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { order: 2 },
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────────

  describe('delete', () => {
    it('should call prisma.category.delete with correct id', async () => {
      prisma.category.delete.mockResolvedValue({ id: 'cat-1' });

      await repo.delete('cat-1', 'user-1');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-1' },
      });
    });
  });

  // ─── countByUserId ──────────────────────────────────────────

  describe('countByUserId', () => {
    it('should call prisma.category.count with userId filter', async () => {
      prisma.category.count.mockResolvedValue(7);

      const result = await repo.countByUserId('user-1');

      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(7);
    });

    it('should return 0 when user has no categories', async () => {
      prisma.category.count.mockResolvedValue(0);

      const result = await repo.countByUserId('user-empty');

      expect(result).toBe(0);
    });
  });

  // ─── countEventGroupsForCategory ───────────────────────────

  describe('countEventGroupsForCategory', () => {
    it('should call prisma.eventGroup.count with categoryId filter', async () => {
      prisma.eventGroup.count.mockResolvedValue(3);

      const result = await repo.countEventGroupsForCategory('cat-1');

      expect(prisma.eventGroup.count).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when category has no event groups', async () => {
      prisma.eventGroup.count.mockResolvedValue(0);

      const result = await repo.countEventGroupsForCategory('cat-empty');

      expect(result).toBe(0);
    });
  });
});
