import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MemoriesService } from './memories.service.js';
import { MemoriesRepository } from './memories.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';

describe('MemoriesService', () => {
  let service: MemoriesService;
  let memoriesRepo: jest.Mocked<MemoriesRepository>;
  let authRepo: jest.Mocked<AuthRepository>;

  const userId = 'user-1';

  function makeDay(
    dateStr: string,
    opts: { dayStateId?: string; dayState?: any; mediaCount?: number } = {},
  ) {
    const media = Array.from({ length: opts.mediaCount ?? 0 }, (_, i) => ({
      id: `media-${dateStr}-${i}`,
    }));
    return {
      id: `day-${dateStr}`,
      userId,
      date: new Date(dateStr + 'T00:00:00Z'),
      dayStateId: opts.dayStateId ?? null,
      dayState: opts.dayState ?? null,
      mainMediaId: null,
      updatedAt: new Date(),
      media,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoriesService,
        {
          provide: MemoriesRepository,
          useValue: {
            findDayWithContent: jest.fn(),
            findDaysByDates: jest.fn(),
            hasContentInRange: jest.fn(),
            findDaysInRange: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserById: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
          },
        },
      ],
    }).compile();

    service = module.get(MemoriesService);
    memoriesRepo = module.get(MemoriesRepository);
    authRepo = module.get(AuthRepository);
  });

  // ─── INTERVAL CALCULATION ──────────────────────────────────

  describe('getOnThisDay — interval calculation', () => {
    it('should compute 1mo, 6mo, 1yr intervals correctly', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });

      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      // Set up days for each interval
      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayStateId: 'ds-1', dayState: mood, mediaCount: 1 }), // 1 month ago
        makeDay('2024-01-15', { dayStateId: 'ds-1', dayState: mood, mediaCount: 0 }), // 6 months ago
        makeDay('2023-07-15', { dayStateId: 'ds-1', dayState: mood, mediaCount: 2 }), // 1 year ago
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');

      expect(result.baseDate).toBe('2024-07-15');
      expect(result.memories).toHaveLength(3);
      expect(result.memories[0].date).toBe('2024-06-15'); // 1 month
      expect(result.memories[1].date).toBe('2024-01-15'); // 6 months
      expect(result.memories[2].date).toBe('2023-07-15'); // 1 year
    });

    it('should respect ordering: 1mo → 6mo → 1yr', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Okay', color: '#FACC15' };

      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-01', { dayStateId: 'ds-1', dayState: mood }),
        makeDay('2024-01-01', { dayStateId: 'ds-1', dayState: mood }),
        makeDay('2023-07-01', { dayStateId: 'ds-1', dayState: mood }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-01');

      expect(result.memories[0].interval).toEqual({ type: 'months', value: 1 });
      expect(result.memories[1].interval).toEqual({ type: 'months', value: 6 });
      expect(result.memories[2].interval).toEqual({ type: 'years', value: 1 });
    });
  });

  // ─── MAX 3 RESULTS ─────────────────────────────────────────

  describe('getOnThisDay — result count', () => {
    it('should return max 3 memories (one per interval)', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayStateId: 'ds-1', dayState: mood }),
        makeDay('2024-01-15', { dayStateId: 'ds-1', dayState: mood }),
        makeDay('2023-07-15', { dayStateId: 'ds-1', dayState: mood }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories.length).toBeLessThanOrEqual(3);
    });

    it('should return 0 memories when selected day has no content', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue(null);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories).toHaveLength(0);
    });

    it('should return partial memories when only some intervals have data', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      // Only 1 month ago has data
      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayStateId: 'ds-1', dayState: mood, mediaCount: 1 }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].date).toBe('2024-06-15');
    });
  });

  // ─── CONTENT FILTERING ─────────────────────────────────────

  describe('getOnThisDay — content filtering', () => {
    it('should include day with mood but no media', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayStateId: 'ds-1', dayState: mood, mediaCount: 0 }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].mood).toEqual(mood);
      expect(result.memories[0].mediaCount).toBe(0);
    });

    it('should include day with media but no mood', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });

      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayState: null, mediaCount: 3 }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].mood).toBeNull();
      expect(result.memories[0].mediaCount).toBe(3);
    });

    it('should exclude day with neither mood nor media', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });

      memoriesRepo.findDaysByDates.mockResolvedValue([
        makeDay('2024-06-15', { dayState: null, mediaCount: 0 }),
      ]);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.memories).toHaveLength(0);
    });
  });

  // ─── FEB 29 / MONTH-END EDGE CASES ────────────────────────

  describe('getOnThisDay — leap year and month-end', () => {
    it('should handle Feb 29 → 1 year ago = Feb 28 (Luxon auto-adjust)', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      // Feb 29, 2024 is a leap year day
      // 1 year ago: Feb 28, 2023 (2023 is not a leap year)
      memoriesRepo.findDaysByDates.mockImplementation(async (_userId, dates) => {
        const dateStrs = dates.map((d: Date) => d.toISOString().split('T')[0]);
        // Verify Luxon adjusted Feb 29 - 1yr to Feb 28
        expect(dateStrs).toContain('2023-02-28');
        // Should NOT contain 2023-02-29 (doesn't exist)
        expect(dateStrs).not.toContain('2023-02-29');

        return [makeDay('2023-02-28', { dayStateId: 'ds-1', dayState: mood })];
      });

      const result = await service.getOnThisDay(userId, '2024-02-29');
      expect(result.baseDate).toBe('2024-02-29');
    });

    it('should handle Mar 31 → 1 month ago = Feb 29 (leap year)', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      // Mar 31, 2024 → 1 month ago = Feb 29 (2024 is leap year)
      memoriesRepo.findDaysByDates.mockImplementation(async (_userId, dates) => {
        const dateStrs = dates.map((d: Date) => d.toISOString().split('T')[0]);
        // Luxon: Mar 31 - 1 month = Feb 29 in 2024
        expect(dateStrs).toContain('2024-02-29');
        return [makeDay('2024-02-29', { dayStateId: 'ds-1', dayState: mood })];
      });

      await service.getOnThisDay(userId, '2024-03-31');
    });

    it('should handle Jan 31 → 1 month ago = Dec 31 (previous year)', async () => {
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };

      memoriesRepo.findDaysByDates.mockImplementation(async (_userId, dates) => {
        const dateStrs = dates.map((d: Date) => d.toISOString().split('T')[0]);
        expect(dateStrs).toContain('2023-12-31');
        return [makeDay('2023-12-31', { dayStateId: 'ds-1', dayState: mood })];
      });

      await service.getOnThisDay(userId, '2024-01-31');
    });
  });

  // ─── TIMEZONE HANDLING ─────────────────────────────────────

  describe('getOnThisDay — timezone', () => {
    it('should use user timezone for date interpretation', async () => {
      authRepo.findUserById.mockResolvedValue({ timezone: 'America/New_York' } as any);
      memoriesRepo.findDayWithContent.mockResolvedValue({ id: 'day-1' });
      memoriesRepo.findDaysByDates.mockResolvedValue([]);

      const result = await service.getOnThisDay(userId, '2024-07-15');

      // The date should be interpreted in the user's timezone
      expect(result.baseDate).toBe('2024-07-15');
    });

    it('should default to UTC when user has no timezone', async () => {
      authRepo.findUserById.mockResolvedValue(null);
      memoriesRepo.findDayWithContent.mockResolvedValue(null);

      const result = await service.getOnThisDay(userId, '2024-07-15');
      expect(result.baseDate).toBe('2024-07-15');
    });
  });

  // ─── INVALID DATE ──────────────────────────────────────────

  describe('getOnThisDay — invalid date', () => {
    it('should throw BadRequestException for invalid date', async () => {
      await expect(
        service.getOnThisDay(userId, 'not-a-date'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── WEEK MODE ─────────────────────────────────────────────

  describe('getContext — week mode', () => {
    it('should return empty memories when current week has no content', async () => {
      memoriesRepo.hasContentInRange.mockResolvedValue(false);

      const result = await service.getContext(userId, 'week' as any, '2024-07-17');

      expect(result).toHaveProperty('type', 'week');
      expect((result as any).memories).toHaveLength(0);
    });

    it('should count active days and total media per historical week', async () => {
      memoriesRepo.hasContentInRange.mockResolvedValue(true);

      const mood = { id: 'ds-1', name: 'Good', color: '#84CC16' };
      memoriesRepo.findDaysInRange.mockResolvedValue([
        // 1 month ago week: 2 active days, 3 total media
        makeDay('2024-06-17', { dayStateId: 'ds-1', dayState: mood, mediaCount: 2 }),
        makeDay('2024-06-18', { dayStateId: 'ds-1', dayState: mood, mediaCount: 1 }),
      ]);

      const result = await service.getContext(userId, 'week' as any, '2024-07-17');

      const weekResult = result as any;
      expect(weekResult.memories.length).toBeGreaterThanOrEqual(1);
      const firstMemory = weekResult.memories[0];
      expect(firstMemory.activeDays).toBe(2);
      expect(firstMemory.totalMedia).toBe(3);
    });

    it('should exclude historical weeks with zero active days', async () => {
      memoriesRepo.hasContentInRange.mockResolvedValue(true);

      // Return days with no mood and no media (inactive)
      memoriesRepo.findDaysInRange.mockResolvedValue([
        makeDay('2024-06-17', { dayState: null, mediaCount: 0 }),
      ]);

      const result = await service.getContext(userId, 'week' as any, '2024-07-17');
      const weekResult = result as any;
      expect(weekResult.memories).toHaveLength(0);
    });
  });
});
