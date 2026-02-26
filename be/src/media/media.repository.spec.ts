import { Test, TestingModule } from '@nestjs/testing';
import { MediaRepository } from './media.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MediaRepository', () => {
  let repo: MediaRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      dayMedia: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      day: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(MediaRepository);
  });

  // ─── create ─────────────────────────────────────────────────

  describe('create', () => {
    it('should call prisma.dayMedia.create with all provided data', async () => {
      const createData = {
        dayId: 'day-1',
        userId: 'user-1',
        s3Key: 'media/abc123.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 204800,
      };
      const mockMedia = { id: 'media-new', ...createData };
      prisma.dayMedia.create.mockResolvedValue(mockMedia);

      const result = await repo.create(createData);

      expect(prisma.dayMedia.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockMedia);
    });
  });

  // ─── findByDayAndUser ────────────────────────────────────────

  describe('findByDayAndUser', () => {
    it('should call prisma.dayMedia.findMany with dayId and userId, ordered by createdAt asc', async () => {
      const mockMedia = [{ id: 'media-1' }, { id: 'media-2' }];
      prisma.dayMedia.findMany.mockResolvedValue(mockMedia);

      const result = await repo.findByDayAndUser('day-1', 'user-1');

      expect(prisma.dayMedia.findMany).toHaveBeenCalledWith({
        where: { dayId: 'day-1', userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockMedia);
    });

    it('should return empty array when day has no media for user', async () => {
      prisma.dayMedia.findMany.mockResolvedValue([]);

      const result = await repo.findByDayAndUser('day-empty', 'user-1');

      expect(result).toEqual([]);
    });
  });

  // ─── findByIdAndUser ────────────────────────────────────────

  describe('findByIdAndUser', () => {
    it('should call prisma.dayMedia.findFirst with id and userId', async () => {
      const mockMedia = { id: 'media-1', userId: 'user-1' };
      prisma.dayMedia.findFirst.mockResolvedValue(mockMedia);

      const result = await repo.findByIdAndUser('media-1', 'user-1');

      expect(prisma.dayMedia.findFirst).toHaveBeenCalledWith({
        where: { id: 'media-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockMedia);
    });

    it('should return null when media does not belong to user', async () => {
      prisma.dayMedia.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndUser('media-1', 'wrong-user');

      expect(result).toBeNull();
    });
  });

  // ─── deleteById ─────────────────────────────────────────────

  describe('deleteById', () => {
    it('should call prisma.dayMedia.delete with correct id', async () => {
      prisma.dayMedia.delete.mockResolvedValue({ id: 'media-1' });

      await repo.deleteById('media-1');

      expect(prisma.dayMedia.delete).toHaveBeenCalledWith({ where: { id: 'media-1' } });
    });
  });

  // ─── findByDayId ────────────────────────────────────────────

  describe('findByDayId', () => {
    it('should call prisma.dayMedia.findMany with dayId, ordered by createdAt asc', async () => {
      const mockMedia = [{ id: 'media-1' }, { id: 'media-2' }];
      prisma.dayMedia.findMany.mockResolvedValue(mockMedia);

      const result = await repo.findByDayId('day-1');

      expect(prisma.dayMedia.findMany).toHaveBeenCalledWith({
        where: { dayId: 'day-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockMedia);
    });

    it('should return empty array when day has no media', async () => {
      prisma.dayMedia.findMany.mockResolvedValue([]);

      const result = await repo.findByDayId('day-no-media');

      expect(result).toEqual([]);
    });
  });

  // ─── findDayByDateAndUser ────────────────────────────────────

  describe('findDayByDateAndUser', () => {
    it('should call prisma.day.findUnique with compound unique key userId_date', async () => {
      const date = new Date('2024-06-15');
      const mockDay = { id: 'day-1', userId: 'user-1', date };
      prisma.day.findUnique.mockResolvedValue(mockDay);

      const result = await repo.findDayByDateAndUser(date, 'user-1');

      expect(prisma.day.findUnique).toHaveBeenCalledWith({
        where: { userId_date: { userId: 'user-1', date } },
      });
      expect(result).toEqual(mockDay);
    });

    it('should return null when day does not exist for user on that date', async () => {
      prisma.day.findUnique.mockResolvedValue(null);

      const result = await repo.findDayByDateAndUser(new Date(), 'user-1');

      expect(result).toBeNull();
    });
  });

  // ─── upsertDay ──────────────────────────────────────────────

  describe('upsertDay', () => {
    it('should call prisma.day.upsert creating or returning existing day', async () => {
      const date = new Date('2024-06-15');
      const mockDay = { id: 'day-1', userId: 'user-1', date, dayStateId: null, mainMediaId: null };
      prisma.day.upsert.mockResolvedValue(mockDay);

      const result = await repo.upsertDay('user-1', date);

      expect(prisma.day.upsert).toHaveBeenCalledWith({
        where: { userId_date: { userId: 'user-1', date } },
        create: { userId: 'user-1', date },
        update: {},
        select: { id: true, userId: true, date: true, dayStateId: true, mainMediaId: true },
      });
      expect(result).toEqual(mockDay);
    });

    it('should not modify existing day data on conflict (empty update)', async () => {
      prisma.day.upsert.mockResolvedValue({ id: 'day-existing' });

      await repo.upsertDay('user-1', new Date());

      const callArg = prisma.day.upsert.mock.calls[0][0];
      expect(callArg.update).toEqual({});
    });
  });

  // ─── setMainMedia ────────────────────────────────────────────

  describe('setMainMedia', () => {
    it('should call prisma.day.update to set mainMediaId', async () => {
      const mockDay = { id: 'day-1', mainMediaId: 'media-1' };
      prisma.day.update.mockResolvedValue(mockDay);

      const result = await repo.setMainMedia('day-1', 'media-1');

      expect(prisma.day.update).toHaveBeenCalledWith({
        where: { id: 'day-1' },
        data: { mainMediaId: 'media-1' },
      });
      expect(result).toEqual(mockDay);
    });
  });

  // ─── clearMainMediaIfMatch ───────────────────────────────────

  describe('clearMainMediaIfMatch', () => {
    it('should call prisma.day.updateMany clearing mainMediaId only when it matches', async () => {
      prisma.day.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.clearMainMediaIfMatch('day-1', 'media-1');

      expect(prisma.day.updateMany).toHaveBeenCalledWith({
        where: { id: 'day-1', mainMediaId: 'media-1' },
        data: { mainMediaId: null },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should return count 0 when mainMediaId does not match', async () => {
      prisma.day.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.clearMainMediaIfMatch('day-1', 'wrong-media-id');

      expect(result).toEqual({ count: 0 });
    });
  });
});
