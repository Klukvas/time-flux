import { Test, TestingModule } from '@nestjs/testing';
import { DayStatesRepository } from './day-states.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DayStatesRepository', () => {
  let repo: DayStatesRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      dayState: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      day: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DayStatesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(DayStatesRepository);
  });

  // ─── findAllByUserId ────────────────────────────────────────

  describe('findAllByUserId', () => {
    it('should call prisma.dayState.findMany with userId and order by order asc', async () => {
      const mockStates = [
        { id: 'state-1', name: 'Great', order: 1 },
        { id: 'state-2', name: 'Good', order: 2 },
      ];
      prisma.dayState.findMany.mockResolvedValue(mockStates);

      const result = await repo.findAllByUserId('user-1');

      expect(prisma.dayState.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockStates);
    });

    it('should return empty array when user has no day states', async () => {
      prisma.dayState.findMany.mockResolvedValue([]);

      const result = await repo.findAllByUserId('user-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── findByIdAndUserId ──────────────────────────────────────

  describe('findByIdAndUserId', () => {
    it('should call prisma.dayState.findFirst with id and userId', async () => {
      const mockState = { id: 'state-1', userId: 'user-1', name: 'Great' };
      prisma.dayState.findFirst.mockResolvedValue(mockState);

      const result = await repo.findByIdAndUserId('state-1', 'user-1');

      expect(prisma.dayState.findFirst).toHaveBeenCalledWith({
        where: { id: 'state-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockState);
    });

    it('should return null when day state does not belong to user', async () => {
      prisma.dayState.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndUserId('state-1', 'wrong-user');

      expect(result).toBeNull();
    });
  });

  // ─── create ─────────────────────────────────────────────────

  describe('create', () => {
    it('should call prisma.dayState.create with all provided data', async () => {
      const createData = {
        userId: 'user-1',
        name: 'Great',
        color: '#00FF00',
        order: 1,
        score: 9,
        isSystem: true,
      };
      const mockState = { id: 'state-new', ...createData };
      prisma.dayState.create.mockResolvedValue(mockState);

      const result = await repo.create(createData);

      expect(prisma.dayState.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockState);
    });

    it('should call prisma.dayState.create with minimal required fields', async () => {
      const createData = {
        userId: 'user-1',
        name: 'Okay',
        color: '#FFFF00',
        score: 5,
      };
      prisma.dayState.create.mockResolvedValue({
        id: 'state-new',
        ...createData,
      });

      await repo.create(createData);

      expect(prisma.dayState.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  // ─── update ─────────────────────────────────────────────────

  describe('update', () => {
    it('should call prisma.dayState.update with correct id and data', async () => {
      const updateData = { name: 'Updated', color: '#FF0000', score: 8 };
      const mockState = { id: 'state-1', ...updateData };
      prisma.dayState.update.mockResolvedValue(mockState);

      const result = await repo.update('state-1', updateData);

      expect(prisma.dayState.update).toHaveBeenCalledWith({
        where: { id: 'state-1' },
        data: updateData,
      });
      expect(result).toEqual(mockState);
    });

    it('should call prisma.dayState.update with partial data', async () => {
      prisma.dayState.update.mockResolvedValue({ id: 'state-1' });

      await repo.update('state-1', { score: 3 });

      expect(prisma.dayState.update).toHaveBeenCalledWith({
        where: { id: 'state-1' },
        data: { score: 3 },
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────────

  describe('delete', () => {
    it('should call prisma.dayState.delete with correct id', async () => {
      prisma.dayState.delete.mockResolvedValue({ id: 'state-1' });

      await repo.delete('state-1', 'user-1');

      expect(prisma.dayState.delete).toHaveBeenCalledWith({
        where: { id: 'state-1', userId: 'user-1' },
      });
    });
  });

  // ─── countByUserId ──────────────────────────────────────────

  describe('countByUserId', () => {
    it('should call prisma.dayState.count with userId filter', async () => {
      prisma.dayState.count.mockResolvedValue(5);

      const result = await repo.countByUserId('user-1');

      expect(prisma.dayState.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when user has no day states', async () => {
      prisma.dayState.count.mockResolvedValue(0);

      const result = await repo.countByUserId('user-empty');

      expect(result).toBe(0);
    });
  });

  // ─── countDaysForDayState ───────────────────────────────────

  describe('countDaysForDayState', () => {
    it('should call prisma.day.count with dayStateId filter', async () => {
      prisma.day.count.mockResolvedValue(12);

      const result = await repo.countDaysForDayState('state-1');

      expect(prisma.day.count).toHaveBeenCalledWith({
        where: { dayStateId: 'state-1' },
      });
      expect(result).toBe(12);
    });

    it('should return 0 when no days use this day state', async () => {
      prisma.day.count.mockResolvedValue(0);

      const result = await repo.countDaysForDayState('state-unused');

      expect(result).toBe(0);
    });
  });
});
