import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsRepository } from './analytics.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AnalyticsRepository', () => {
  let repo: AnalyticsRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      dayState: {
        findMany: jest.fn(),
      },
      day: {
        findMany: jest.fn(),
      },
      eventPeriod: {
        findMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(AnalyticsRepository);
  });

  // ─── findAllDayStates ───────────────────────────────────────

  describe('findAllDayStates', () => {
    it('should call prisma.dayState.findMany with userId and select score fields', async () => {
      const mockStates = [
        { id: 'state-1', name: 'Great', color: '#00FF00', score: 9 },
        { id: 'state-2', name: 'Good', color: '#AAFFAA', score: 7 },
      ];
      prisma.dayState.findMany.mockResolvedValue(mockStates);

      const result = await repo.findAllDayStates('user-1');

      expect(prisma.dayState.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, name: true, color: true, score: true },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockStates);
    });

    it('should return empty array when user has no day states', async () => {
      prisma.dayState.findMany.mockResolvedValue([]);

      const result = await repo.findAllDayStates('user-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── findAllDaysWithMood ────────────────────────────────────

  describe('findAllDaysWithMood', () => {
    it('should call prisma.day.findMany filtering only days with a dayState', async () => {
      const mockDays = [{ id: 'day-1', dayState: { id: 'state-1', name: 'Great', color: '#00FF00' } }];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findAllDaysWithMood('user-1');

      expect(prisma.day.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', dayStateId: { not: null } },
        include: {
          dayState: { select: { id: true, name: true, color: true } },
        },
        orderBy: { date: 'asc' },
      });
      expect(result).toEqual(mockDays);
    });

    it('should return empty array when user has no mood days', async () => {
      prisma.day.findMany.mockResolvedValue([]);

      const result = await repo.findAllDaysWithMood('user-no-moods');

      expect(result).toEqual([]);
    });
  });

  // ─── findAllDaysWithMediaCount ──────────────────────────────

  describe('findAllDaysWithMediaCount', () => {
    it('should call prisma.day.findMany with media count select', async () => {
      const mockDays = [
        { id: 'day-1', date: new Date(), dayStateId: 'state-1', _count: { media: 3 } },
      ];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findAllDaysWithMediaCount('user-1');

      expect(prisma.day.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          date: true,
          dayStateId: true,
          _count: { select: { media: true } },
        },
        orderBy: { date: 'asc' },
      });
      expect(result).toEqual(mockDays);
    });

    it('should include all user days regardless of media count', async () => {
      prisma.day.findMany.mockResolvedValue([]);

      await repo.findAllDaysWithMediaCount('user-1');

      const callArg = prisma.day.findMany.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty('dayStateId');
    });
  });

  // ─── findAllEventPeriods ────────────────────────────────────

  describe('findAllEventPeriods', () => {
    it('should call prisma.eventPeriod.findMany filtered by eventGroup userId', async () => {
      const mockPeriods = [
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-06-30') },
      ];
      prisma.eventPeriod.findMany.mockResolvedValue(mockPeriods);

      const result = await repo.findAllEventPeriods('user-1');

      expect(prisma.eventPeriod.findMany).toHaveBeenCalledWith({
        where: { eventGroup: { userId: 'user-1' } },
        select: { startDate: true, endDate: true },
      });
      expect(result).toEqual(mockPeriods);
    });

    it('should return empty array when user has no event periods', async () => {
      prisma.eventPeriod.findMany.mockResolvedValue([]);

      const result = await repo.findAllEventPeriods('user-no-periods');

      expect(result).toEqual([]);
    });
  });

  // ─── findDaysWithMoodInRange ────────────────────────────────

  describe('findDaysWithMoodInRange', () => {
    it('should call prisma.day.findMany with userId, date range, and dayStateId filter', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-06-30');
      const mockDays = [{ id: 'day-1', dayState: { id: 'state-1', name: 'Good', color: '#AAFFAA' } }];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findDaysWithMoodInRange('user-1', from, to);

      expect(prisma.day.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          dayStateId: { not: null },
          date: { gte: from, lte: to },
        },
        include: {
          dayState: { select: { id: true, name: true, color: true } },
        },
        orderBy: { date: 'asc' },
      });
      expect(result).toEqual(mockDays);
    });

    it('should return empty array when no mood days fall in the date range', async () => {
      prisma.day.findMany.mockResolvedValue([]);
      const from = new Date('2020-01-01');
      const to = new Date('2020-12-31');

      const result = await repo.findDaysWithMoodInRange('user-1', from, to);

      expect(result).toEqual([]);
    });
  });

  // ─── findAllCategoriesWithPeriods ───────────────────────────

  describe('findAllCategoriesWithPeriods', () => {
    it('should call prisma.category.findMany with nested eventGroups and periods select', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Work',
          eventGroups: [
            { periods: [{ startDate: new Date('2024-01-01'), endDate: new Date('2024-06-30') }] },
          ],
        },
      ];
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await repo.findAllCategoriesWithPeriods('user-1');

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          name: true,
          eventGroups: {
            select: {
              periods: {
                select: { startDate: true, endDate: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array when user has no categories', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await repo.findAllCategoriesWithPeriods('user-empty');

      expect(result).toEqual([]);
    });

    it('should return categories with empty eventGroups when category has no groups', async () => {
      const mockCategories = [{ id: 'cat-1', name: 'Empty Category', eventGroups: [] }];
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await repo.findAllCategoriesWithPeriods('user-1');

      expect(result).toEqual(mockCategories);
    });
  });
});
