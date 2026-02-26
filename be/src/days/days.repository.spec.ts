import { Test, TestingModule } from '@nestjs/testing';
import { DaysRepository } from './days.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DaysRepository', () => {
  let repo: DaysRepository;
  let prisma: any;

  const dayInclude = {
    dayState: { select: { id: true, name: true, color: true } },
    media: {
      select: { id: true, s3Key: true, fileName: true, contentType: true, size: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    },
  };

  beforeEach(async () => {
    prisma = {
      day: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaysRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(DaysRepository);
  });

  // ─── upsert ─────────────────────────────────────────────────

  describe('upsert', () => {
    it('should call prisma.day.upsert with userId and date as unique key', async () => {
      const date = new Date('2024-06-15');
      const mockDay = { id: 'day-1', userId: 'user-1', date, dayStateId: 'state-1' };
      prisma.day.upsert.mockResolvedValue(mockDay);

      const result = await repo.upsert('user-1', date, { dayStateId: 'state-1' });

      expect(prisma.day.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_date: { userId: 'user-1', date } },
          create: expect.objectContaining({ userId: 'user-1', date }),
          update: expect.objectContaining({ dayStateId: 'state-1' }),
        }),
      );
      expect(result).toEqual(mockDay);
    });

    it('should include only defined fields in update payload', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsert('user-1', date, { dayStateId: 'state-1' });

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toHaveProperty('dayStateId', 'state-1');
      expect(callArg.update).not.toHaveProperty('mainMediaId');
    });

    it('should include mainMediaId when it is explicitly set to null', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsert('user-1', date, { mainMediaId: null });

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toHaveProperty('mainMediaId', null);
    });

    it('should include both fields when both are provided', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsert('user-1', date, { dayStateId: 'state-1', mainMediaId: 'media-1' });

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toEqual({ dayStateId: 'state-1', mainMediaId: 'media-1' });
    });

    it('should pass empty update when no data fields are defined', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsert('user-1', date, {});

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toEqual({});
    });
  });

  // ─── upsertLocation ─────────────────────────────────────────

  describe('upsertLocation', () => {
    it('should call prisma.day.upsert with location data', async () => {
      const date = new Date('2024-06-15');
      const locationData = { locationName: 'Paris', latitude: 48.8566, longitude: 2.3522 };
      const mockDay = { id: 'day-1', userId: 'user-1', date, ...locationData };
      prisma.day.upsert.mockResolvedValue(mockDay);

      const result = await repo.upsertLocation('user-1', date, locationData);

      expect(prisma.day.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_date: { userId: 'user-1', date } },
          create: expect.objectContaining({ userId: 'user-1', date }),
          update: expect.objectContaining(locationData),
        }),
      );
      expect(result).toEqual(mockDay);
    });

    it('should include only defined location fields in update payload', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsertLocation('user-1', date, { locationName: 'Berlin' });

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toHaveProperty('locationName', 'Berlin');
      expect(callArg.update).not.toHaveProperty('latitude');
      expect(callArg.update).not.toHaveProperty('longitude');
    });

    it('should include null values when explicitly set', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsertLocation('user-1', date, { locationName: null, latitude: null, longitude: null });

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toEqual({ locationName: null, latitude: null, longitude: null });
    });

    it('should pass empty update when no location data is provided', async () => {
      const date = new Date('2024-06-15');
      prisma.day.upsert.mockResolvedValue({ id: 'day-1' });

      await repo.upsertLocation('user-1', date, {});

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toEqual({});
    });
  });

  // ─── findByUserIdAndDateRange ────────────────────────────────

  describe('findByUserIdAndDateRange', () => {
    it('should call prisma.day.findMany with userId and date range filter', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');
      const mockDays = [{ id: 'day-1' }, { id: 'day-2' }];
      prisma.day.findMany.mockResolvedValue(mockDays);

      const result = await repo.findByUserIdAndDateRange('user-1', from, to);

      expect(prisma.day.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', date: { gte: from, lte: to } },
          orderBy: { date: 'asc' },
        }),
      );
      expect(result).toEqual(mockDays);
    });

    it('should return empty array when no days exist in the range', async () => {
      prisma.day.findMany.mockResolvedValue([]);
      const from = new Date('2020-01-01');
      const to = new Date('2020-01-31');

      const result = await repo.findByUserIdAndDateRange('user-no-days', from, to);

      expect(result).toEqual([]);
    });

    it('should order results by date ascending', async () => {
      prisma.day.findMany.mockResolvedValue([]);

      await repo.findByUserIdAndDateRange('user-1', new Date(), new Date());

      const callArg = prisma.day.findMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ date: 'asc' });
    });
  });
});
