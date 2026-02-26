import { Test, TestingModule } from '@nestjs/testing';
import { MemoriesRepository } from './memories.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MemoriesRepository', () => {
  let repo: MemoriesRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      day: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoriesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(MemoriesRepository);
  });

  // ─── findDayWithContent ─────────────────────────────────────

  describe('findDayWithContent', () => {
    it('should call prisma.day.findFirst with userId, date, and OR content filter', async () => {
      const date = new Date('2024-06-15');
      const mockDay = { id: 'day-1' };
      prisma.day.findFirst.mockResolvedValue(mockDay);

      const result = await repo.findDayWithContent('user-1', date);

      expect(prisma.day.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date,
          OR: [{ dayStateId: { not: null } }, { media: { some: {} } }],
        },
        select: { id: true },
      });
      expect(result).toEqual(mockDay);
    });

    it('should return null when day has no content', async () => {
      prisma.day.findFirst.mockResolvedValue(null);

      const result = await repo.findDayWithContent('user-1', new Date());

      expect(result).toBeNull();
    });
  });

  // ─── findDaysByDates ────────────────────────────────────────

  describe('findDaysByDates', () => {
    it('should call prisma.day.findMany with userId and dates in filter', async () => {
      const dates = [new Date('2024-01-01'), new Date('2024-01-15')];
      const mockDays = [
        { id: 'day-1', dayState: { id: 'state-1', name: 'Great', color: '#00FF00' }, media: [] },
        { id: 'day-2', dayState: null, media: [{ id: 'media-1' }] },
      ];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findDaysByDates('user-1', dates);

      expect(prisma.day.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', date: { in: dates } },
        include: {
          dayState: { select: { id: true, name: true, color: true } },
          media: { select: { id: true } },
        },
      });
      expect(result).toEqual(mockDays);
    });

    it('should return empty array without calling prisma when dates is empty', async () => {
      const result = await repo.findDaysByDates('user-1', []);

      expect(prisma.day.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle a single date correctly', async () => {
      const dates = [new Date('2024-03-20')];
      prisma.day.findMany.mockResolvedValue([{ id: 'day-1' }]);

      const result = await repo.findDaysByDates('user-1', dates);

      expect(prisma.day.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', date: { in: dates } },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  // ─── hasContentInRange ──────────────────────────────────────

  describe('hasContentInRange', () => {
    it('should return true when a day with content exists in range', async () => {
      prisma.day.findFirst.mockResolvedValue({ id: 'day-1' });
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const result = await repo.hasContentInRange('user-1', start, end);

      expect(prisma.day.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: { gte: start, lte: end },
          OR: [{ dayStateId: { not: null } }, { media: { some: {} } }],
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when no day with content exists in range', async () => {
      prisma.day.findFirst.mockResolvedValue(null);
      const start = new Date('2020-01-01');
      const end = new Date('2020-12-31');

      const result = await repo.hasContentInRange('user-1', start, end);

      expect(result).toBe(false);
    });

    it('should coerce any found day to boolean true', async () => {
      prisma.day.findFirst.mockResolvedValue({ id: 'day-any' });

      const result = await repo.hasContentInRange('user-1', new Date(), new Date());

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  // ─── findDaysInRange ────────────────────────────────────────

  describe('findDaysInRange', () => {
    it('should call prisma.day.findMany with userId and date range', async () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      const mockDays = [
        { id: 'day-1', dayState: { id: 'state-1', name: 'Good', color: '#AAFFAA' }, media: [] },
      ];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findDaysInRange('user-1', start, end);

      expect(prisma.day.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: { gte: start, lte: end },
        },
        include: {
          dayState: { select: { id: true, name: true, color: true } },
          media: { select: { id: true } },
        },
      });
      expect(result).toEqual(mockDays);
    });

    it('should return empty array when no days exist in the range', async () => {
      prisma.day.findMany.mockResolvedValue([]);

      const result = await repo.findDaysInRange('user-1', new Date('2000-01-01'), new Date('2000-01-31'));

      expect(result).toEqual([]);
    });

    it('should not filter by content — returns all days including those with no mood or media', async () => {
      prisma.day.findMany.mockResolvedValue([]);

      await repo.findDaysInRange('user-1', new Date(), new Date());

      const callArg = prisma.day.findMany.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty('OR');
      expect(callArg.where).not.toHaveProperty('dayStateId');
    });
  });
});
