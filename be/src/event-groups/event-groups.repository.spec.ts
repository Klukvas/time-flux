import { Test, TestingModule } from '@nestjs/testing';
import { EventGroupsRepository } from './event-groups.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('EventGroupsRepository', () => {
  let repo: EventGroupsRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      eventGroup: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      eventPeriod: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventGroupsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(EventGroupsRepository);
  });

  // ─── findGroupByIdAndUserId ─────────────────────────────────

  describe('findGroupByIdAndUserId', () => {
    it('should call prisma.eventGroup.findFirst with correct where clause', async () => {
      const mockGroup = {
        id: 'group-1',
        userId: 'user-1',
        title: 'Test Group',
      };
      prisma.eventGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await repo.findGroupByIdAndUserId('group-1', 'user-1');

      expect(prisma.eventGroup.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'group-1', userId: 'user-1' } }),
      );
      expect(result).toEqual(mockGroup);
    });

    it('should return null when group is not found', async () => {
      prisma.eventGroup.findFirst.mockResolvedValue(null);

      const result = await repo.findGroupByIdAndUserId('nonexistent', 'user-1');

      expect(result).toBeNull();
    });

    it('should use provided transaction client instead of this.prisma', async () => {
      const txMock = {
        eventGroup: {
          findFirst: jest.fn().mockResolvedValue({ id: 'group-tx' }),
        },
      };

      await repo.findGroupByIdAndUserId('group-1', 'user-1', txMock);

      expect(txMock.eventGroup.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'group-1', userId: 'user-1' } }),
      );
      expect(prisma.eventGroup.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─── findAllGroupsByUserId ──────────────────────────────────

  describe('findAllGroupsByUserId', () => {
    it('should call prisma.eventGroup.findMany with correct userId filter', async () => {
      const mockGroups = [{ id: 'group-1' }, { id: 'group-2' }];
      prisma.eventGroup.findMany.mockResolvedValue(mockGroups);

      const result = await repo.findAllGroupsByUserId('user-1');

      expect(prisma.eventGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { updatedAt: 'desc' },
        }),
      );
      expect(result).toEqual(mockGroups);
    });

    it('should return empty array when user has no groups', async () => {
      prisma.eventGroup.findMany.mockResolvedValue([]);

      const result = await repo.findAllGroupsByUserId('user-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── createGroup ────────────────────────────────────────────

  describe('createGroup', () => {
    it('should call prisma.eventGroup.create with correct data', async () => {
      const createData = {
        userId: 'user-1',
        categoryId: 'cat-1',
        title: 'New Group',
        description: 'Desc',
      };
      const mockGroup = { id: 'group-new', ...createData };
      prisma.eventGroup.create.mockResolvedValue(mockGroup);

      const result = await repo.createGroup(createData);

      expect(prisma.eventGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: createData }),
      );
      expect(result).toEqual(mockGroup);
    });

    it('should use transaction client when tx is provided', async () => {
      const createData = {
        userId: 'user-1',
        categoryId: 'cat-1',
        title: 'TX Group',
      };
      const txMock = {
        eventGroup: { create: jest.fn().mockResolvedValue({ id: 'group-tx' }) },
      };

      await repo.createGroup(createData, txMock);

      expect(txMock.eventGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: createData }),
      );
      expect(prisma.eventGroup.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateGroup ────────────────────────────────────────────

  describe('updateGroup', () => {
    it('should call prisma.eventGroup.update with correct id and data', async () => {
      const updateData = { title: 'Updated Title' };
      const mockGroup = { id: 'group-1', ...updateData };
      prisma.eventGroup.update.mockResolvedValue(mockGroup);

      const result = await repo.updateGroup('group-1', updateData);

      expect(prisma.eventGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'group-1' }, data: updateData }),
      );
      expect(result).toEqual(mockGroup);
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventGroup: { update: jest.fn().mockResolvedValue({ id: 'group-tx' }) },
      };

      await repo.updateGroup('group-1', { title: 'TX Update' }, txMock);

      expect(txMock.eventGroup.update).toHaveBeenCalled();
      expect(prisma.eventGroup.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteGroup ────────────────────────────────────────────

  describe('deleteGroup', () => {
    it('should call prisma.eventGroup.delete with correct id', async () => {
      prisma.eventGroup.delete.mockResolvedValue({ id: 'group-1' });

      await repo.deleteGroup('group-1', 'user-1');

      expect(prisma.eventGroup.delete).toHaveBeenCalledWith({
        where: { id: 'group-1', userId: 'user-1' },
      });
    });
  });

  // ─── countPeriodsForGroup ───────────────────────────────────

  describe('countPeriodsForGroup', () => {
    it('should call prisma.eventPeriod.count with groupId filter', async () => {
      prisma.eventPeriod.count.mockResolvedValue(5);

      const result = await repo.countPeriodsForGroup('group-1');

      expect(prisma.eventPeriod.count).toHaveBeenCalledWith({
        where: { eventGroupId: 'group-1' },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when group has no periods', async () => {
      prisma.eventPeriod.count.mockResolvedValue(0);

      const result = await repo.countPeriodsForGroup('group-empty');

      expect(result).toBe(0);
    });
  });

  // ─── findPeriodById ─────────────────────────────────────────

  describe('findPeriodById', () => {
    it('should call prisma.eventPeriod.findFirst with correct id', async () => {
      const mockPeriod = { id: 'period-1' };
      prisma.eventPeriod.findFirst.mockResolvedValue(mockPeriod);

      const result = await repo.findPeriodById('period-1');

      expect(prisma.eventPeriod.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'period-1' } }),
      );
      expect(result).toEqual(mockPeriod);
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventPeriod: {
          findFirst: jest.fn().mockResolvedValue({ id: 'period-tx' }),
        },
      };

      await repo.findPeriodById('period-1', txMock);

      expect(txMock.eventPeriod.findFirst).toHaveBeenCalled();
      expect(prisma.eventPeriod.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─── findPeriodByIdAndUserId ────────────────────────────────

  describe('findPeriodByIdAndUserId', () => {
    it('should call prisma.eventPeriod.findFirst with id and userId in eventGroup', async () => {
      const mockPeriod = { id: 'period-1' };
      prisma.eventPeriod.findFirst.mockResolvedValue(mockPeriod);

      const result = await repo.findPeriodByIdAndUserId('period-1', 'user-1');

      expect(prisma.eventPeriod.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'period-1', eventGroup: { userId: 'user-1' } },
        }),
      );
      expect(result).toEqual(mockPeriod);
    });

    it('should return null when period does not belong to user', async () => {
      prisma.eventPeriod.findFirst.mockResolvedValue(null);

      const result = await repo.findPeriodByIdAndUserId(
        'period-1',
        'wrong-user',
      );

      expect(result).toBeNull();
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventPeriod: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      await repo.findPeriodByIdAndUserId('period-1', 'user-1', txMock);

      expect(txMock.eventPeriod.findFirst).toHaveBeenCalled();
      expect(prisma.eventPeriod.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─── findActivePeriodForGroup ───────────────────────────────

  describe('findActivePeriodForGroup', () => {
    it('should call prisma.eventPeriod.findFirst with endDate: null', async () => {
      const mockPeriod = { id: 'period-active', endDate: null };
      prisma.eventPeriod.findFirst.mockResolvedValue(mockPeriod);

      const result = await repo.findActivePeriodForGroup('group-1');

      expect(prisma.eventPeriod.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventGroupId: 'group-1',
            endDate: null,
          }),
        }),
      );
      expect(result).toEqual(mockPeriod);
    });

    it('should exclude a specific period when excludePeriodId is provided', async () => {
      prisma.eventPeriod.findFirst.mockResolvedValue(null);

      await repo.findActivePeriodForGroup('group-1', 'exclude-period-id');

      expect(prisma.eventPeriod.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'exclude-period-id' } }),
        }),
      );
    });

    it('should not include id filter when excludePeriodId is undefined', async () => {
      prisma.eventPeriod.findFirst.mockResolvedValue(null);

      await repo.findActivePeriodForGroup('group-1');

      const callArg = prisma.eventPeriod.findFirst.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty('id');
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventPeriod: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      await repo.findActivePeriodForGroup('group-1', undefined, txMock);

      expect(txMock.eventPeriod.findFirst).toHaveBeenCalled();
      expect(prisma.eventPeriod.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─── createPeriod ───────────────────────────────────────────

  describe('createPeriod', () => {
    it('should call prisma.eventPeriod.create with correct data', async () => {
      const createData = {
        eventGroupId: 'group-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      const mockPeriod = { id: 'period-new', ...createData };
      prisma.eventPeriod.create.mockResolvedValue(mockPeriod);

      const result = await repo.createPeriod(createData);

      expect(prisma.eventPeriod.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: createData }),
      );
      expect(result).toEqual(mockPeriod);
    });

    it('should use transaction client when tx is provided', async () => {
      const createData = { eventGroupId: 'group-1', startDate: new Date() };
      const txMock = {
        eventPeriod: {
          create: jest.fn().mockResolvedValue({ id: 'period-tx' }),
        },
      };

      await repo.createPeriod(createData, txMock);

      expect(txMock.eventPeriod.create).toHaveBeenCalled();
      expect(prisma.eventPeriod.create).not.toHaveBeenCalled();
    });
  });

  // ─── updatePeriod ───────────────────────────────────────────

  describe('updatePeriod', () => {
    it('should call prisma.eventPeriod.update with correct id and data', async () => {
      const updateData = { endDate: new Date('2024-12-31') };
      const mockPeriod = { id: 'period-1', ...updateData };
      prisma.eventPeriod.update.mockResolvedValue(mockPeriod);

      const result = await repo.updatePeriod('period-1', updateData);

      expect(prisma.eventPeriod.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'period-1' },
          data: updateData,
        }),
      );
      expect(result).toEqual(mockPeriod);
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventPeriod: {
          update: jest.fn().mockResolvedValue({ id: 'period-tx' }),
        },
      };

      await repo.updatePeriod('period-1', { endDate: null }, txMock);

      expect(txMock.eventPeriod.update).toHaveBeenCalled();
      expect(prisma.eventPeriod.update).not.toHaveBeenCalled();
    });
  });

  // ─── deletePeriod ───────────────────────────────────────────

  describe('deletePeriod', () => {
    it('should call prisma.eventPeriod.delete with correct id', async () => {
      prisma.eventPeriod.delete.mockResolvedValue({ id: 'period-1' });

      await repo.deletePeriod('period-1', 'user-1');

      expect(prisma.eventPeriod.delete).toHaveBeenCalledWith({
        where: { id: 'period-1', eventGroup: { userId: 'user-1' } },
      });
    });
  });

  // ─── findClosedPeriodsForGroup ──────────────────────────────

  describe('findClosedPeriodsForGroup', () => {
    it('should call prisma.eventPeriod.findMany with endDate not null filter', async () => {
      const mockPeriods = [
        { id: 'period-1', startDate: new Date(), endDate: new Date() },
      ];
      prisma.eventPeriod.findMany.mockResolvedValue(mockPeriods);

      const result = await repo.findClosedPeriodsForGroup('group-1');

      expect(prisma.eventPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventGroupId: 'group-1',
            endDate: { not: null },
          }),
        }),
      );
      expect(result).toEqual(mockPeriods);
    });

    it('should exclude a specific period when excludePeriodId is provided', async () => {
      prisma.eventPeriod.findMany.mockResolvedValue([]);

      await repo.findClosedPeriodsForGroup('group-1', 'exclude-id');

      expect(prisma.eventPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'exclude-id' } }),
        }),
      );
    });

    it('should use transaction client when tx is provided', async () => {
      const txMock = {
        eventPeriod: { findMany: jest.fn().mockResolvedValue([]) },
      };

      await repo.findClosedPeriodsForGroup('group-1', undefined, txMock);

      expect(txMock.eventPeriod.findMany).toHaveBeenCalled();
      expect(prisma.eventPeriod.findMany).not.toHaveBeenCalled();
    });
  });

  // ─── findPeriodsWithDateRange ───────────────────────────────

  describe('findPeriodsWithDateRange', () => {
    it('should call prisma.eventPeriod.findMany with userId filter and no date constraints', async () => {
      const mockPeriods = [{ id: 'period-1' }];
      prisma.eventPeriod.findMany.mockResolvedValue(mockPeriods);

      const result = await repo.findPeriodsWithDateRange('user-1');

      expect(prisma.eventPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventGroup: { userId: 'user-1' } }),
          orderBy: { startDate: 'desc' },
        }),
      );
      expect(result).toEqual(mockPeriods);
    });

    it('should include AND clause when from and to dates are provided', async () => {
      prisma.eventPeriod.findMany.mockResolvedValue([]);
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');

      await repo.findPeriodsWithDateRange('user-1', from, to);

      const callArg = prisma.eventPeriod.findMany.mock.calls[0][0];
      expect(callArg.where.AND).toBeDefined();
    });

    it('should return empty array when no periods match', async () => {
      prisma.eventPeriod.findMany.mockResolvedValue([]);

      const result = await repo.findPeriodsWithDateRange(
        'user-1',
        new Date(),
        new Date(),
      );

      expect(result).toEqual([]);
    });
  });

  // ─── findPeriodsOverlapping ─────────────────────────────────

  describe('findPeriodsOverlapping', () => {
    it('should call prisma.eventPeriod.findMany with overlap filter', async () => {
      const mockPeriods = [{ id: 'period-overlap' }];
      prisma.eventPeriod.findMany.mockResolvedValue(mockPeriods);
      const rangeStart = new Date('2024-03-01');
      const rangeEnd = new Date('2024-09-30');

      const result = await repo.findPeriodsOverlapping(
        'user-1',
        rangeStart,
        rangeEnd,
      );

      expect(prisma.eventPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventGroup: { userId: 'user-1' },
            startDate: { lte: rangeEnd },
          }),
          orderBy: { startDate: 'desc' },
        }),
      );
      expect(result).toEqual(mockPeriods);
    });

    it('should include OR clause for endDate overlap or open period', async () => {
      prisma.eventPeriod.findMany.mockResolvedValue([]);
      const rangeStart = new Date('2024-01-01');
      const rangeEnd = new Date('2024-06-30');

      await repo.findPeriodsOverlapping('user-1', rangeStart, rangeEnd);

      const callArg = prisma.eventPeriod.findMany.mock.calls[0][0];
      expect(callArg.where.OR).toBeDefined();
      expect(callArg.where.OR).toContainEqual({ endDate: null });
    });
  });
});
