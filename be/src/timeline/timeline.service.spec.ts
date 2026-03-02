jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { TimelineService } from './timeline.service.js';
import { EventGroupsRepository } from '../event-groups/event-groups.repository.js';
import { DaysRepository } from '../days/days.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { InvalidDateRangeError } from '../common/errors/app.error.js';

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = 'user-abc';

function makeCategory(overrides: Partial<any> = {}) {
  return {
    id: 'cat-1',
    name: 'Work',
    color: '#3B82F6',
    ...overrides,
  };
}

const NOW = new Date('2024-01-01T00:00:00Z');

function makePeriodRaw(overrides: Partial<any> = {}): any {
  return {
    id: 'period-1',
    eventGroupId: 'group-1',
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-06-30T00:00:00Z'),
    comment: 'A test period',
    createdAt: NOW,
    updatedAt: NOW,
    eventGroup: {
      id: 'group-1',
      userId: USER_ID,
      categoryId: 'cat-1',
      title: 'Work Project',
      description: null,
      createdAt: NOW,
      updatedAt: NOW,
      category: makeCategory(),
    },
    ...overrides,
  };
}

function makeMediaRaw(overrides: Partial<any> = {}): any {
  return {
    id: 'media-1',
    s3Key: 'uploads/user-abc/photo.jpg',
    fileName: 'photo.jpg',
    contentType: 'image/jpeg',
    size: 204800,
    createdAt: new Date('2025-03-15T10:00:00Z'),
    ...overrides,
  };
}

function makeDayRaw(overrides: Partial<any> = {}): any {
  return {
    id: 'day-1',
    userId: USER_ID,
    date: new Date('2025-03-15T00:00:00Z'),
    dayStateId: 'ds-1',
    mainMediaId: null,
    locationName: null,
    latitude: null,
    longitude: null,
    updatedAt: NOW,
    dayState: { id: 'ds-1', name: 'Great', color: '#22c55e' },
    media: [],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe('TimelineService', () => {
  let service: TimelineService;
  let eventGroupsRepo: jest.Mocked<EventGroupsRepository>;
  let daysRepo: jest.Mocked<DaysRepository>;
  let s3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: EventGroupsRepository,
          useValue: {
            findPeriodsWithDateRange: jest.fn(),
          },
        },
        {
          provide: DaysRepository,
          useValue: {
            findByUserIdAndDateRange: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getPresignedReadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TimelineService);
    eventGroupsRepo = module.get(
      EventGroupsRepository,
    ) as jest.Mocked<EventGroupsRepository>;
    daysRepo = module.get(DaysRepository) as jest.Mocked<DaysRepository>;
    s3Service = module.get(S3Service) as jest.Mocked<S3Service>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── getTimeline ─────────────────────────────────────────

  describe('getTimeline', () => {
    beforeEach(() => {
      s3Service.getPresignedReadUrl.mockResolvedValue(
        'https://s3.example.com/presigned/photo.jpg',
      );
    });

    it('returns periods and days formatted correctly', async () => {
      const rawPeriod = makePeriodRaw();
      const rawDay = makeDayRaw();

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([rawDay]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-06-30',
        },
        'UTC',
      );

      expect(result.from).toBe('2025-01-01');
      expect(result.to).toBe('2025-06-30');

      expect(result.periods).toHaveLength(1);
      expect(result.periods[0]).toEqual({
        id: 'period-1',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        comment: 'A test period',
        eventGroup: { id: 'group-1', title: 'Work Project' },
        category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
      });

      expect(result.days).toHaveLength(1);
      expect(result.days[0]).toEqual({
        id: 'day-1',
        date: '2025-03-15',
        dayState: { id: 'ds-1', name: 'Great', color: '#22c55e' },
        mainMediaId: null,
        locationName: null,
        latitude: null,
        longitude: null,
        comment: null,
        media: [],
      });
    });

    it('uses default date range of 1 year ago to today when no from/to provided', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(USER_ID, {}, 'UTC');

      const today = DateTime.now().setZone('UTC').startOf('day');
      const oneYearAgo = today.minus({ years: 1 });

      expect(result.to).toBe(today.toISODate());
      expect(result.from).toBe(oneYearAgo.toISODate());
    });

    it('respects custom from and to query params', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2024-03-01',
          to: '2024-09-30',
        },
        'UTC',
      );

      expect(result.from).toBe('2024-03-01');
      expect(result.to).toBe('2024-09-30');

      expect(eventGroupsRepo.findPeriodsWithDateRange).toHaveBeenCalledWith(
        USER_ID,
        expect.any(Date),
        expect.any(Date),
      );
      expect(daysRepo.findByUserIdAndDateRange).toHaveBeenCalledWith(
        USER_ID,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('throws InvalidDateRangeError when from is after to', async () => {
      await expect(
        service.getTimeline(
          USER_ID,
          {
            from: '2025-12-31',
            to: '2025-01-01',
          },
          'UTC',
        ),
      ).rejects.toThrow(InvalidDateRangeError);

      expect(eventGroupsRepo.findPeriodsWithDateRange).not.toHaveBeenCalled();
      expect(daysRepo.findByUserIdAndDateRange).not.toHaveBeenCalled();
    });

    it('throws InvalidDateRangeError with correct error code', async () => {
      await expect(
        service.getTimeline(
          USER_ID,
          {
            from: '2025-06-01',
            to: '2025-01-01',
          },
          'UTC',
        ),
      ).rejects.toMatchObject({
        errorCode: 'INVALID_DATE_RANGE',
        statusCode: 400,
      });
    });

    it('formats media items with presigned S3 URLs', async () => {
      const rawMedia = makeMediaRaw();
      const rawDay = makeDayRaw({ media: [rawMedia] });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([rawDay]);
      s3Service.getPresignedReadUrl.mockResolvedValue(
        'https://s3.example.com/presigned/photo.jpg',
      );

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-12-31',
        },
        'UTC',
      );

      expect(s3Service.getPresignedReadUrl).toHaveBeenCalledWith(
        'uploads/user-abc/photo.jpg',
      );

      expect(result.days[0].media).toHaveLength(1);
      expect(result.days[0].media[0]).toEqual({
        id: 'media-1',
        s3Key: 'uploads/user-abc/photo.jpg',
        url: 'https://s3.example.com/presigned/photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 204800,
        createdAt: '2025-03-15T10:00:00.000Z',
      });
    });

    it('formats multiple media items and calls getPresignedReadUrl for each', async () => {
      const media1 = makeMediaRaw({
        id: 'media-1',
        s3Key: 'uploads/user-abc/a.jpg',
      });
      const media2 = makeMediaRaw({
        id: 'media-2',
        s3Key: 'uploads/user-abc/b.jpg',
      });
      const rawDay = makeDayRaw({ media: [media1, media2] });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([rawDay]);
      s3Service.getPresignedReadUrl
        .mockResolvedValueOnce('https://s3.example.com/a')
        .mockResolvedValueOnce('https://s3.example.com/b');

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-12-31',
        },
        'UTC',
      );

      expect(s3Service.getPresignedReadUrl).toHaveBeenCalledTimes(2);
      expect(result.days[0].media[0].url).toBe('https://s3.example.com/a');
      expect(result.days[0].media[1].url).toBe('https://s3.example.com/b');
    });

    it('defaults to UTC timezone when UTC is passed', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-06-30',
        },
        'UTC',
      );

      expect(result.from).toBe('2025-01-01');
      expect(result.to).toBe('2025-06-30');
    });

    it('uses timezone parameter for date range formatting', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-03-01',
          to: '2025-03-31',
        },
        'UTC',
      );

      expect(result.from).toBe('2025-03-01');
      expect(result.to).toBe('2025-03-31');
    });

    it('returns empty periods and days when none exist in range', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-01-31',
        },
        'UTC',
      );

      expect(result.periods).toEqual([]);
      expect(result.days).toEqual([]);
    });

    it('handles day with null dayState', async () => {
      const rawDay = makeDayRaw({ dayState: null, dayStateId: null });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([rawDay]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-12-31',
        },
        'UTC',
      );

      expect(result.days[0].dayState).toBeNull();
    });

    it('handles day with mainMediaId set', async () => {
      const rawDay = makeDayRaw({ mainMediaId: 'media-1' });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([rawDay]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-12-31',
        },
        'UTC',
      );

      expect(result.days[0].mainMediaId).toBe('media-1');
    });

    it('applies user timezone when formatting period dates', async () => {
      // A period starting at midnight UTC on Jan 1 is Dec 31 in New York (UTC-5)
      const rawPeriod = makePeriodRaw({
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-06-01T00:00:00Z'),
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2024-12-31',
          to: '2025-06-01',
        },
        'America/New_York',
      );

      // UTC midnight Jan 1 = Dec 31 in America/New_York
      expect(result.periods[0].startDate).toBe('2024-12-31');
    });

    it('allows same-day range (from equals to)', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-05-01',
          to: '2025-05-01',
        },
        'UTC',
      );

      expect(result.from).toBe('2025-05-01');
      expect(result.to).toBe('2025-05-01');
    });

    it('calls repositories once each per invocation', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-03-31',
        },
        'UTC',
      );

      expect(eventGroupsRepo.findPeriodsWithDateRange).toHaveBeenCalledTimes(1);
      expect(daysRepo.findByUserIdAndDateRange).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getWeekTimeline ─────────────────────────────────────

  describe('getWeekTimeline', () => {
    beforeEach(() => {
      s3Service.getPresignedReadUrl.mockResolvedValue(
        'https://s3.example.com/presigned/photo.jpg',
      );
    });

    it('returns exactly 7 days from Monday to Sunday', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      // Wednesday 2025-03-19 — week should be Mon 17 to Sun 23
      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      expect(result.weekStart).toBe('2025-03-17');
      expect(result.weekEnd).toBe('2025-03-23');
      expect(result.days).toHaveLength(7);
    });

    it('fills all 7 days with null dayState when no days exist', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      expect(result.days).toHaveLength(7);
      result.days.forEach((day) => {
        expect(day.dayState).toBeNull();
        expect(day.mainMediaId).toBeNull();
        expect(day.media).toEqual([]);
      });
    });

    it('fills in correct date strings for each day of the week', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      // Monday 2025-03-17 chosen directly
      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-17',
        },
        'UTC',
      );

      const expectedDates = [
        '2025-03-17',
        '2025-03-18',
        '2025-03-19',
        '2025-03-20',
        '2025-03-21',
        '2025-03-22',
        '2025-03-23',
      ];
      expect(result.days.map((d) => d.date)).toEqual(expectedDates);
    });

    it('merges existing day data when day is present in the database', async () => {
      const existingDay = makeDayRaw({
        date: new Date('2025-03-19T00:00:00Z'),
        dayState: { id: 'ds-2', name: 'Good', color: '#86efac' },
        mainMediaId: 'media-42',
        media: [],
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([existingDay]);

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      const wednesday = result.days.find((d) => d.date === '2025-03-19');
      expect(wednesday).toBeDefined();
      expect(wednesday!.dayState).toEqual({
        id: 'ds-2',
        name: 'Good',
        color: '#86efac',
      });
      expect(wednesday!.mainMediaId).toBe('media-42');
    });

    it('leaves days without DB records as null dayState / null mainMediaId', async () => {
      const existingDay = makeDayRaw({
        date: new Date('2025-03-19T00:00:00Z'),
        dayState: { id: 'ds-1', name: 'Great', color: '#22c55e' },
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([existingDay]);

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      const monday = result.days.find((d) => d.date === '2025-03-17');
      expect(monday!.dayState).toBeNull();
      expect(monday!.mainMediaId).toBeNull();
    });

    it('formats periods using the formatPeriod helper', async () => {
      const rawPeriod = makePeriodRaw({
        startDate: new Date('2025-03-10T00:00:00Z'),
        endDate: new Date('2025-03-25T00:00:00Z'),
        comment: 'Sprint 5',
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      expect(result.periods).toHaveLength(1);
      expect(result.periods[0]).toEqual({
        id: 'period-1',
        startDate: '2025-03-10',
        endDate: '2025-03-25',
        comment: 'Sprint 5',
        eventGroup: { id: 'group-1', title: 'Work Project' },
        category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
      });
    });

    it('returns correct weekStart and weekEnd from a Sunday input', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      // Sunday 2025-03-23 — ISO week still Mon 17 to Sun 23
      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-23',
        },
        'UTC',
      );

      expect(result.weekStart).toBe('2025-03-17');
      expect(result.weekEnd).toBe('2025-03-23');
    });

    it('formats media with presigned URLs for days in the week view', async () => {
      const rawMedia = makeMediaRaw();
      const existingDay = makeDayRaw({
        date: new Date('2025-03-19T00:00:00Z'),
        media: [rawMedia],
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([existingDay]);
      s3Service.getPresignedReadUrl.mockResolvedValue(
        'https://s3.example.com/presigned/photo.jpg',
      );

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      const wednesday = result.days.find((d) => d.date === '2025-03-19');
      expect(wednesday!.media).toHaveLength(1);
      expect(wednesday!.media[0]).toMatchObject({
        id: 'media-1',
        s3Key: 'uploads/user-abc/photo.jpg',
        url: 'https://s3.example.com/presigned/photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 204800,
      });
    });

    it('returns empty periods array when no periods overlap the week', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'UTC',
      );

      expect(result.periods).toEqual([]);
    });

    it('uses user timezone when calculating week boundaries', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      // Monday 2025-03-17 in New York — week is still 17-23 because it IS Monday local time
      const result = await service.getWeekTimeline(
        USER_ID,
        {
          date: '2025-03-19',
        },
        'America/New_York',
      );

      expect(result.days).toHaveLength(7);
    });

    it('calls repositories once per request', async () => {
      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([]);
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      await service.getWeekTimeline(USER_ID, { date: '2025-03-19' }, 'UTC');

      expect(eventGroupsRepo.findPeriodsWithDateRange).toHaveBeenCalledTimes(1);
      expect(daysRepo.findByUserIdAndDateRange).toHaveBeenCalledTimes(1);
    });
  });

  // ─── formatPeriod (standalone function via service output) ─

  describe('formatPeriod — via getTimeline output', () => {
    beforeEach(() => {
      s3Service.getPresignedReadUrl.mockResolvedValue(
        'https://s3.example.com/presigned/x',
      );
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);
    });

    it('formats a closed period with both startDate and endDate', async () => {
      const rawPeriod = makePeriodRaw({
        id: 'period-closed',
        startDate: new Date('2024-06-01T00:00:00Z'),
        endDate: new Date('2024-08-31T00:00:00Z'),
        comment: 'Summer quarter',
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2024-06-01',
          to: '2024-08-31',
        },
        'UTC',
      );

      expect(result.periods[0]).toEqual({
        id: 'period-closed',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        comment: 'Summer quarter',
        eventGroup: { id: 'group-1', title: 'Work Project' },
        category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
      });
    });

    it('formats an open-ended period (endDate is null)', async () => {
      const rawPeriod = makePeriodRaw({
        id: 'period-open',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: null,
        comment: 'Ongoing chapter',
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-12-31',
        },
        'UTC',
      );

      expect(result.periods[0].endDate).toBeNull();
      expect(result.periods[0].startDate).toBe('2025-01-01');
      expect(result.periods[0].comment).toBe('Ongoing chapter');
    });

    it('includes full category on period', async () => {
      const rawPeriod = makePeriodRaw({
        eventGroup: {
          id: 'group-2',
          title: 'Health Journey',
          category: { id: 'cat-health', name: 'Health', color: '#f43f5e' },
        },
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-06-30',
        },
        'UTC',
      );

      expect(result.periods[0].category).toEqual({
        id: 'cat-health',
        name: 'Health',
        color: '#f43f5e',
      });
      expect(result.periods[0].eventGroup).toEqual({
        id: 'group-2',
        title: 'Health Journey',
      });
    });

    it('formats period with null comment', async () => {
      const rawPeriod = makePeriodRaw({ comment: null });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([rawPeriod]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2025-01-01',
          to: '2025-06-30',
        },
        'UTC',
      );

      expect(result.periods[0].comment).toBeNull();
    });

    it('formats multiple periods returned by repository', async () => {
      const period1 = makePeriodRaw({
        id: 'p-1',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-03-31T00:00:00Z'),
        comment: 'Q1',
      });
      const period2 = makePeriodRaw({
        id: 'p-2',
        startDate: new Date('2024-07-01T00:00:00Z'),
        endDate: null,
        comment: 'Q3 onwards',
      });

      eventGroupsRepo.findPeriodsWithDateRange.mockResolvedValue([
        period1,
        period2,
      ]);

      const result = await service.getTimeline(
        USER_ID,
        {
          from: '2024-01-01',
          to: '2024-12-31',
        },
        'UTC',
      );

      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].id).toBe('p-1');
      expect(result.periods[0].endDate).toBe('2024-03-31');
      expect(result.periods[1].id).toBe('p-2');
      expect(result.periods[1].endDate).toBeNull();
    });
  });
});
