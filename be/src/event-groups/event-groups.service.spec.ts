jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { Test, TestingModule } from '@nestjs/testing';
import { EventGroupsService } from './event-groups.service.js';
import { EventGroupsRepository } from './event-groups.repository.js';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { DaysRepository } from '../days/days.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ActivePeriodExistsError,
  CategoryNotFoundError,
  EventAlreadyClosedError,
  EventGroupInUseError,
  EventGroupNotFoundError,
  EventPeriodNotFoundError,
  InvalidDateRangeError,
  PeriodOverlapError,
} from '../common/errors/app.error.js';

describe('EventGroupsService — Period Business Logic', () => {
  let service: EventGroupsService;
  let repo: jest.Mocked<EventGroupsRepository>;
  let categoriesRepo: jest.Mocked<CategoriesRepository>;
  let authRepo: jest.Mocked<AuthRepository>;
  let prisma: any;

  const userId = 'user-1';
  const groupId = 'group-1';

  const mockGroup = {
    id: groupId,
    userId,
    categoryId: 'cat-1',
    title: 'Test Chapter',
    description: null,
    category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
    periods: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const makePeriod = (
    id: string,
    start: string,
    end: string | null,
    comment?: string,
  ) => ({
    id,
    eventGroupId: groupId,
    startDate: new Date(start + 'T00:00:00Z'),
    endDate: end ? new Date(end + 'T00:00:00Z') : null,
    comment: comment ?? null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    eventGroup: mockGroup,
  });

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation(async (cb: any) => cb(prisma)),
      dayState: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventGroupsService,
        {
          provide: EventGroupsRepository,
          useValue: {
            findGroupByIdAndUserId: jest.fn(),
            findAllGroupsByUserId: jest.fn(),
            createGroup: jest.fn(),
            updateGroup: jest.fn(),
            deleteGroup: jest.fn(),
            countPeriodsForGroup: jest.fn(),
            findPeriodByIdAndUserId: jest.fn(),
            findActivePeriodForGroup: jest.fn(),
            findClosedPeriodsForGroup: jest.fn(),
            createPeriod: jest.fn(),
            updatePeriod: jest.fn(),
            deletePeriod: jest.fn(),
          },
        },
        {
          provide: CategoriesRepository,
          useValue: {
            findByIdAndUserId: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserById: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
          },
        },
        {
          provide: DaysRepository,
          useValue: {
            findByUserIdAndDateRange: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getPresignedReadUrl: jest.fn().mockResolvedValue('https://s3.example.com/read'),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(EventGroupsService);
    repo = module.get(EventGroupsRepository);
    categoriesRepo = module.get(CategoriesRepository);
    authRepo = module.get(AuthRepository);
  });

  // ─── ACTIVE PERIOD CONSTRAINT ──────────────────────────────

  describe('createPeriod — active period constraint', () => {
    beforeEach(() => {
      repo.findGroupByIdAndUserId.mockResolvedValue(mockGroup as any);
      repo.findClosedPeriodsForGroup.mockResolvedValue([]);
    });

    it('should reject creating active period when one already exists', async () => {
      repo.findActivePeriodForGroup.mockResolvedValue(makePeriod('p-existing', '2024-01-01', null) as any);

      await expect(
        service.createPeriod(userId, groupId, { startDate: '2024-06-01' }),
      ).rejects.toThrow(ActivePeriodExistsError);
    });

    it('should allow creating active period when none exists', async () => {
      repo.findActivePeriodForGroup.mockResolvedValue(null);
      repo.createPeriod.mockResolvedValue(makePeriod('p-new', '2024-06-01', null) as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({
          ...mockGroup,
          periods: [makePeriod('p-new', '2024-06-01', null)],
        } as any);

      const result = await service.createPeriod(userId, groupId, { startDate: '2024-06-01' });
      expect(result.periods).toHaveLength(1);
    });

    it('should allow creating closed period even when active exists (no active check for closed)', async () => {
      // The active period check is only for periods without endDate
      repo.findActivePeriodForGroup.mockResolvedValue(
        makePeriod('p-active', '2024-01-01', null) as any,
      );
      repo.createPeriod.mockResolvedValue(makePeriod('p-closed', '2024-03-01', '2024-05-01') as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({
          ...mockGroup,
          periods: [
            makePeriod('p-active', '2024-01-01', null),
            makePeriod('p-closed', '2024-03-01', '2024-05-01'),
          ],
        } as any);

      // Providing endDate should skip active period check
      const result = await service.createPeriod(userId, groupId, {
        startDate: '2024-03-01',
        endDate: '2024-05-01',
      });
      expect(result.periods).toHaveLength(2);
    });
  });

  // ─── PERIOD OVERLAP DETECTION ──────────────────────────────

  describe('createPeriod — overlap detection', () => {
    beforeEach(() => {
      repo.findGroupByIdAndUserId.mockResolvedValue(mockGroup as any);
      repo.findActivePeriodForGroup.mockResolvedValue(null);
    });

    it('should reject overlapping closed periods', async () => {
      // Existing: Jan 1 – Mar 31
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-03-31T00:00:00Z'),
        },
      ]);

      // New: Feb 1 – Apr 30 (overlaps with existing)
      await expect(
        service.createPeriod(userId, groupId, {
          startDate: '2024-02-01',
          endDate: '2024-04-30',
        }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should allow adjacent periods (touching edges)', async () => {
      // Existing: Jan 1 – Jan 31
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T00:00:00Z'),
        },
      ]);

      // New: Jan 31 – Feb 28 (starts exactly at existing end)
      // Overlap check: existing.start < new.end AND new.start < existing.end
      // 2024-01-01 < 2024-02-28 = true AND 2024-01-31 < 2024-01-31 = false
      // → NOT an overlap (touching edge)
      repo.createPeriod.mockResolvedValue(makePeriod('p-new', '2024-01-31', '2024-02-28') as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({ ...mockGroup, periods: [makePeriod('p-new', '2024-01-31', '2024-02-28')] } as any);

      const result = await service.createPeriod(userId, groupId, {
        startDate: '2024-01-31',
        endDate: '2024-02-28',
      });
      expect(result.periods).toHaveLength(1);
    });

    it('should reject period fully contained within existing', async () => {
      // Existing: Jan 1 – Jun 30
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-06-30T00:00:00Z'),
        },
      ]);

      // New: Feb 1 – Mar 31 (fully inside existing)
      await expect(
        service.createPeriod(userId, groupId, {
          startDate: '2024-02-01',
          endDate: '2024-03-31',
        }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should reject period that fully contains existing', async () => {
      // Existing: Feb 1 – Mar 31
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-02-01T00:00:00Z'),
          endDate: new Date('2024-03-31T00:00:00Z'),
        },
      ]);

      // New: Jan 1 – Jun 30 (wraps existing)
      await expect(
        service.createPeriod(userId, groupId, {
          startDate: '2024-01-01',
          endDate: '2024-06-30',
        }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should not check overlap for open-ended (active) periods', async () => {
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-03-31T00:00:00Z'),
        },
      ]);
      repo.findActivePeriodForGroup.mockResolvedValue(null);

      // Active period (no endDate) — overlap check is skipped
      repo.createPeriod.mockResolvedValue(makePeriod('p-active', '2024-02-01', null) as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({ ...mockGroup, periods: [makePeriod('p-active', '2024-02-01', null)] } as any);

      const result = await service.createPeriod(userId, groupId, { startDate: '2024-02-01' });
      expect(result.periods).toHaveLength(1);
    });

    it('should allow boundary-sharing periods (existing 01–10, new 10–20)', async () => {
      // Existing: Jan 1 – Jan 10
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-10T00:00:00Z'),
        },
      ]);

      // New: Jan 10 – Jan 20 (shares boundary at Jan 10)
      // Overlap check: 10 < 10 = false → no overlap
      repo.createPeriod.mockResolvedValue(makePeriod('p-new', '2024-01-10', '2024-01-20') as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({ ...mockGroup, periods: [makePeriod('p-new', '2024-01-10', '2024-01-20')] } as any);

      const result = await service.createPeriod(userId, groupId, {
        startDate: '2024-01-10',
        endDate: '2024-01-20',
      });
      expect(result.periods).toHaveLength(1);
    });

    it('should reject exact same date range as existing period', async () => {
      // Existing: Jan 1 – Jan 31
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T00:00:00Z'),
        },
      ]);

      // New: Jan 1 – Jan 31 (exact same range)
      await expect(
        service.createPeriod(userId, groupId, {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should allow non-overlapping periods with gap between them', async () => {
      // Existing: Jan 1 – Jan 31
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T00:00:00Z'),
        },
      ]);

      // New: Mar 1 – Apr 30 (gap between Feb 1 and Feb 29)
      repo.createPeriod.mockResolvedValue(makePeriod('p-new', '2024-03-01', '2024-04-30') as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({ ...mockGroup, periods: [makePeriod('p-new', '2024-03-01', '2024-04-30')] } as any);

      const result = await service.createPeriod(userId, groupId, {
        startDate: '2024-03-01',
        endDate: '2024-04-30',
      });
      expect(result.periods).toHaveLength(1);
    });
  });

  // ─── DATE RANGE VALIDATION ─────────────────────────────────

  describe('createPeriod — date validation', () => {
    beforeEach(() => {
      repo.findGroupByIdAndUserId.mockResolvedValue(mockGroup as any);
    });

    it('should reject start date after end date', async () => {
      await expect(
        service.createPeriod(userId, groupId, {
          startDate: '2024-06-01',
          endDate: '2024-01-01',
        }),
      ).rejects.toThrow(InvalidDateRangeError);
    });

    it('should allow same start and end date (single-day period)', async () => {
      repo.findClosedPeriodsForGroup.mockResolvedValue([]);
      repo.createPeriod.mockResolvedValue(makePeriod('p-new', '2024-03-15', '2024-03-15') as any);
      repo.findGroupByIdAndUserId
        .mockResolvedValueOnce(mockGroup as any)
        .mockResolvedValueOnce({ ...mockGroup, periods: [makePeriod('p-new', '2024-03-15', '2024-03-15')] } as any);

      const result = await service.createPeriod(userId, groupId, {
        startDate: '2024-03-15',
        endDate: '2024-03-15',
      });
      expect(result.periods).toHaveLength(1);
    });
  });

  // ─── CLOSE PERIOD ──────────────────────────────────────────

  describe('closePeriod', () => {
    it('should reject closing an already closed period', async () => {
      repo.findPeriodByIdAndUserId.mockResolvedValue(
        makePeriod('p-1', '2024-01-01', '2024-03-31') as any,
      );

      await expect(
        service.closePeriod(userId, 'p-1', { endDate: '2024-06-30' }),
      ).rejects.toThrow(EventAlreadyClosedError);
    });

    it('should reject endDate before startDate when closing', async () => {
      repo.findPeriodByIdAndUserId.mockResolvedValue(
        makePeriod('p-1', '2024-06-01', null) as any,
      );

      await expect(
        service.closePeriod(userId, 'p-1', { endDate: '2024-01-01' }),
      ).rejects.toThrow(InvalidDateRangeError);
    });

    it('should allow closing period on the same day as start date', async () => {
      const activePeriod = makePeriod('p-active', '2024-06-01', null);
      repo.findPeriodByIdAndUserId.mockResolvedValue(activePeriod as any);
      repo.findClosedPeriodsForGroup.mockResolvedValue([]);
      repo.updatePeriod.mockResolvedValue({
        ...activePeriod,
        endDate: new Date('2024-06-01T00:00:00Z'),
      } as any);
      repo.findGroupByIdAndUserId.mockResolvedValue({
        ...mockGroup,
        periods: [makePeriod('p-active', '2024-06-01', '2024-06-01')],
      } as any);

      const result = await service.closePeriod(userId, 'p-active', { endDate: '2024-06-01' });
      expect(result.periods[0].endDate).toBe('2024-06-01');
    });

    it('should check for overlaps when closing period', async () => {
      const activePeriod = makePeriod('p-active', '2024-03-01', null);
      repo.findPeriodByIdAndUserId.mockResolvedValue(activePeriod as any);
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-existing',
          startDate: new Date('2024-04-01T00:00:00Z'),
          endDate: new Date('2024-06-30T00:00:00Z'),
        },
      ]);

      // Closing p-active from Mar 1 to May 31 overlaps with existing Apr 1 – Jun 30
      await expect(
        service.closePeriod(userId, 'p-active', { endDate: '2024-05-31' }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should successfully close period that does not overlap', async () => {
      const activePeriod = makePeriod('p-active', '2024-01-01', null);
      repo.findPeriodByIdAndUserId.mockResolvedValue(activePeriod as any);
      repo.findClosedPeriodsForGroup.mockResolvedValue([]);
      repo.updatePeriod.mockResolvedValue({
        ...activePeriod,
        endDate: new Date('2024-02-28T00:00:00Z'),
      } as any);
      repo.findGroupByIdAndUserId.mockResolvedValue({
        ...mockGroup,
        periods: [makePeriod('p-active', '2024-01-01', '2024-02-28')],
      } as any);

      const result = await service.closePeriod(userId, 'p-active', { endDate: '2024-02-28' });
      expect(result.periods[0].endDate).toBe('2024-02-28');
    });
  });

  // ─── UPDATE PERIOD ─────────────────────────────────────────

  describe('updatePeriod', () => {
    it('should revalidate overlap when changing dates', async () => {
      const period = makePeriod('p-1', '2024-01-01', '2024-02-28');
      repo.findPeriodByIdAndUserId.mockResolvedValue(period as any);
      repo.findClosedPeriodsForGroup.mockResolvedValue([
        {
          id: 'p-other',
          startDate: new Date('2024-04-01T00:00:00Z'),
          endDate: new Date('2024-06-30T00:00:00Z'),
        },
      ]);

      // Extending end date to overlap with existing
      await expect(
        service.updatePeriod(userId, 'p-1', { endDate: '2024-05-15' }),
      ).rejects.toThrow(PeriodOverlapError);
    });

    it('should reject update that makes endDate before startDate', async () => {
      const period = makePeriod('p-1', '2024-06-01', '2024-08-31');
      repo.findPeriodByIdAndUserId.mockResolvedValue(period as any);

      await expect(
        service.updatePeriod(userId, 'p-1', { endDate: '2024-01-01' }),
      ).rejects.toThrow(InvalidDateRangeError);
    });

    it('should check active period constraint when removing endDate', async () => {
      const period = makePeriod('p-1', '2024-01-01', '2024-03-31');
      repo.findPeriodByIdAndUserId.mockResolvedValue(period as any);
      repo.findActivePeriodForGroup.mockResolvedValue(
        makePeriod('p-other-active', '2024-06-01', null) as any,
      );

      // Removing endDate → making it active, but another active exists
      await expect(
        service.updatePeriod(userId, 'p-1', { endDate: '' as any }),
      ).rejects.toThrow(ActivePeriodExistsError);
    });

    it('should exclude self when checking active period (allows staying active)', async () => {
      const activePeriod = makePeriod('p-1', '2024-01-01', null);
      repo.findPeriodByIdAndUserId.mockResolvedValue(activePeriod as any);
      // findActivePeriodForGroup excludes self via excludePeriodId
      repo.findActivePeriodForGroup.mockResolvedValue(null);
      repo.findClosedPeriodsForGroup.mockResolvedValue([]);
      repo.updatePeriod.mockResolvedValue(activePeriod as any);
      repo.findGroupByIdAndUserId.mockResolvedValue({
        ...mockGroup,
        periods: [activePeriod],
      } as any);

      // Updating comment on an active period should not trigger active period error
      const result = await service.updatePeriod(userId, 'p-1', { comment: 'updated' });
      expect(result).toBeDefined();
    });
  });

  // ─── DELETE GROUP ──────────────────────────────────────────

  describe('deleteGroup', () => {
    it('should reject deleting group with periods', async () => {
      repo.findGroupByIdAndUserId.mockResolvedValue(mockGroup as any);
      repo.countPeriodsForGroup.mockResolvedValue(3);

      await expect(service.deleteGroup(userId, groupId)).rejects.toThrow(EventGroupInUseError);
    });

    it('should allow deleting group with zero periods', async () => {
      repo.findGroupByIdAndUserId.mockResolvedValue(mockGroup as any);
      repo.countPeriodsForGroup.mockResolvedValue(0);
      repo.deleteGroup.mockResolvedValue(undefined as any);

      await expect(service.deleteGroup(userId, groupId)).resolves.toBeUndefined();
      expect(repo.deleteGroup).toHaveBeenCalledWith(groupId);
    });

    it('should reject deleting non-existent group', async () => {
      repo.findGroupByIdAndUserId.mockResolvedValue(null);

      await expect(service.deleteGroup(userId, 'non-existent')).rejects.toThrow(
        EventGroupNotFoundError,
      );
    });
  });

  // ─── CREATE GROUP CATEGORY VALIDATION ──────────────────────

  describe('createGroup', () => {
    it('should reject creating group with non-existent category', async () => {
      categoriesRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.createGroup(userId, { categoryId: 'bad-cat', title: 'Test' }),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });

  // ─── NOT FOUND ERRORS ─────────────────────────────────────

  describe('not found errors', () => {
    it('should throw on period not found', async () => {
      repo.findPeriodByIdAndUserId.mockResolvedValue(null);

      await expect(service.closePeriod(userId, 'nonexistent', { endDate: '2024-12-31' }))
        .rejects.toThrow(EventPeriodNotFoundError);
    });

    it('should throw on group not found for createPeriod', async () => {
      repo.findGroupByIdAndUserId.mockResolvedValue(null);

      await expect(service.createPeriod(userId, 'nonexistent', { startDate: '2024-01-01' }))
        .rejects.toThrow(EventGroupNotFoundError);
    });

    it('should throw on period not found for deletePeriod', async () => {
      repo.findPeriodByIdAndUserId.mockResolvedValue(null);

      await expect(service.deletePeriod(userId, 'nonexistent'))
        .rejects.toThrow(EventPeriodNotFoundError);
    });
  });
});
