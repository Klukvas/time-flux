jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service.js';
import { MediaRepository } from './media.repository.js';
import { S3Service } from '../s3/s3.service.js';
import {
  EventPeriodNotFoundError,
  ForbiddenError,
  FutureDateError,
  MediaNotFoundError,
  QuotaExceededError,
  ValidationError,
} from '../common/errors/app.error.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<MediaRepository>;
  let s3Service: jest.Mocked<S3Service>;
  let subscriptionsService: { assertResourceLimit: jest.Mock };
  let prismaMock: {
    $transaction: jest.Mock;
    dayMedia: { count: jest.Mock };
    day: { upsert: jest.Mock; findUnique: jest.Mock };
    eventPeriod: { findFirst: jest.Mock };
  };

  const userId = 'user-1';
  const timezone = 'UTC';

  const mockMedia = {
    id: 'media-1',
    dayId: 'day-1',
    userId,
    s3Key: 'uploads/user-1/abc.jpg',
    fileName: 'photo.jpg',
    contentType: 'image/jpeg',
    size: 1024000,
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockDay = {
    id: 'day-1',
    userId,
    date: new Date('2024-01-15T00:00:00Z'),
    mainMediaId: null,
  };

  beforeEach(async () => {
    subscriptionsService = {
      assertResourceLimit: jest.fn(),
    };

    prismaMock = {
      $transaction: jest.fn(),
      dayMedia: { count: jest.fn().mockResolvedValue(0) },
      day: {
        upsert: jest.fn().mockResolvedValue(mockDay),
        findUnique: jest.fn().mockResolvedValue(mockDay),
      },
      eventPeriod: { findFirst: jest.fn() },
    };

    // Default transaction: runs the callback with a tx that mimics prisma
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        dayMedia: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue(mockMedia),
        },
        day: {
          upsert: jest.fn().mockResolvedValue(mockDay),
        },
      };
      return cb(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockMedia),
            findByDayAndUser: jest.fn(),
            findByIdAndUser: jest.fn(),
            deleteById: jest.fn(),
            findByDayId: jest.fn(),
            findDayByDateAndUser: jest.fn(),
            upsertDay: jest.fn().mockResolvedValue(mockDay),
            setMainMedia: jest.fn(),
            clearMainMediaIfMatch: jest.fn(),
            countByUserId: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getPresignedReadUrl: jest
              .fn()
              .mockResolvedValue('https://s3.example.com/read'),
            deleteObject: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(MediaService);
    mediaRepo = module.get(MediaRepository);
    s3Service = module.get(S3Service);
  });

  // ─── FUTURE DATE VALIDATION ────────────────────────────────

  describe('addMedia — future date validation', () => {
    it('should reject dates more than 1 day in the future', async () => {
      // Set a date far in the future
      await expect(
        service.addMedia(
          userId,
          '2099-12-31',
          {
            s3Key: 'uploads/user-1/file.jpg',
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
          },
          timezone,
        ),
      ).rejects.toThrow(FutureDateError);
    });

    it('should allow today date', async () => {
      const today = new Date().toISOString().split('T')[0];

      const result = await service.addMedia(
        userId,
        today,
        {
          s3Key: `uploads/${userId}/file.jpg`,
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        },
        timezone,
      );

      expect(result).toHaveProperty('id');
    });
  });

  // ─── AUTO COVER SELECTION ──────────────────────────────────

  describe('addMedia — auto cover photo', () => {
    it('should auto-set first image as cover when no cover exists', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(mockMedia),
          },
          day: {
            upsert: jest
              .fn()
              .mockResolvedValue({ ...mockDay, mainMediaId: null }),
          },
        };
        return cb(tx);
      });

      await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/photo.jpg`,
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        },
        timezone,
      );

      expect(mediaRepo.setMainMedia).toHaveBeenCalledWith('day-1', 'media-1');
    });

    it('should NOT override existing cover photo', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(mockMedia),
          },
          day: {
            upsert: jest
              .fn()
              .mockResolvedValue({ ...mockDay, mainMediaId: 'existing-cover' }),
          },
        };
        return cb(tx);
      });

      await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/photo.jpg`,
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        },
        timezone,
      );

      expect(mediaRepo.setMainMedia).not.toHaveBeenCalled();
    });

    it('should NOT auto-set cover for video uploads', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest
              .fn()
              .mockResolvedValue({ ...mockMedia, contentType: 'video/mp4' }),
          },
          day: {
            upsert: jest
              .fn()
              .mockResolvedValue({ ...mockDay, mainMediaId: null }),
          },
        };
        return cb(tx);
      });

      await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/video.mp4`,
          fileName: 'video.mp4',
          contentType: 'video/mp4',
          size: 10000000,
        },
        timezone,
      );

      expect(mediaRepo.setMainMedia).not.toHaveBeenCalled();
    });
  });

  // ─── DAY UPSERT ───────────────────────────────────────────

  describe('addMedia — day upsert', () => {
    it('should upsert day record before creating media', async () => {
      let capturedTx: any;
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(mockMedia),
          },
          day: {
            upsert: jest.fn().mockResolvedValue(mockDay),
          },
        };
        capturedTx = tx;
        return cb(tx);
      });

      await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/file.jpg`,
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        },
        timezone,
      );

      expect(capturedTx.day.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_date: { userId, date: new Date('2024-01-15T00:00:00Z') },
          },
        }),
      );
      expect(capturedTx.dayMedia.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dayId: 'day-1' }),
        }),
      );
    });
  });

  // ─── DELETE MEDIA ──────────────────────────────────────────

  describe('deleteMedia', () => {
    it('should reject deleting non-existent media', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(null);

      await expect(service.deleteMedia(userId, 'nonexistent')).rejects.toThrow(
        MediaNotFoundError,
      );
    });

    it('should clear cover photo if deleted media was cover', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);

      await service.deleteMedia(userId, 'media-1');

      expect(mediaRepo.clearMainMediaIfMatch).toHaveBeenCalledWith(
        'day-1',
        'media-1',
      );
    });

    it('should delete from S3 before deleting from DB', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);

      const callOrder: string[] = [];
      s3Service.deleteObject.mockImplementation(async () => {
        callOrder.push('s3');
      });
      mediaRepo.deleteById.mockImplementation(async () => {
        callOrder.push('db');
        return undefined as any;
      });

      await service.deleteMedia(userId, 'media-1');

      expect(callOrder).toEqual(['db', 's3']);
    });

    it('should pass correct S3 key to delete', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);

      await service.deleteMedia(userId, 'media-1');

      expect(s3Service.deleteObject).toHaveBeenCalledWith(
        'uploads/user-1/abc.jpg',
      );
    });
  });

  // ─── GET MEDIA FOR DAY ─────────────────────────────────────

  describe('getMediaForDay', () => {
    it('should return empty array when day does not exist', async () => {
      mediaRepo.findDayByDateAndUser.mockResolvedValue(null);

      const result = await service.getMediaForDay(userId, '2024-01-15');

      expect(result).toEqual([]);
    });

    it('should return formatted media with presigned URLs', async () => {
      mediaRepo.findDayByDateAndUser.mockResolvedValue(mockDay as any);
      mediaRepo.findByDayAndUser.mockResolvedValue([mockMedia] as any);

      const result = await service.getMediaForDay(userId, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('url', 'https://s3.example.com/read');
      expect(result[0]).toHaveProperty('id', 'media-1');
      expect(result[0]).toHaveProperty('contentType', 'image/jpeg');
    });
  });

  // ─── QUOTA ENFORCEMENT ────────────────────────────────────

  describe('addMedia — quota enforcement', () => {
    it('should throw QuotaExceededError when media at limit', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(50),
            create: jest.fn(),
          },
          day: { upsert: jest.fn() },
        };
        subscriptionsService.assertResourceLimit.mockRejectedValue(
          new QuotaExceededError({
            resource: 'media',
            current: 50,
            limit: 50,
            tier: 'FREE',
          }),
        );
        return cb(tx);
      });

      await expect(
        service.addMedia(
          userId,
          '2024-01-15',
          {
            s3Key: `uploads/${userId}/file.jpg`,
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
          },
          timezone,
        ),
      ).rejects.toThrow(QuotaExceededError);
    });
  });

  // ─── TIMEZONE-AWARE FUTURE DATE CHECK ──────────────────────

  describe('addMedia — timezone-aware validation', () => {
    it('should use provided timezone for future date check', async () => {
      await expect(
        service.addMedia(
          userId,
          '2099-01-01',
          {
            s3Key: `uploads/${userId}/file.jpg`,
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
          },
          'Pacific/Auckland',
        ),
      ).rejects.toThrow(FutureDateError);
    });
  });

  // ─── S3 KEY IDOR PREVENTION ──────────────────────────────

  describe('addMedia — s3Key IDOR', () => {
    it('should reject s3Key belonging to another user', async () => {
      await expect(
        service.addMedia(
          userId,
          '2024-01-15',
          {
            s3Key: 'uploads/other-user/file.jpg',
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
          },
          timezone,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── PERIOD VALIDATION ──────────────────────────────────

  describe('addMedia — period validation', () => {
    it('should pass periodId through to created media', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-12-31T00:00:00Z'),
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest
              .fn()
              .mockResolvedValue({ ...mockMedia, periodId: 'period-1' }),
          },
          day: {
            upsert: jest.fn().mockResolvedValue(mockDay),
          },
          eventPeriod: {
            findFirst: jest.fn().mockResolvedValue(mockPeriod),
          },
        };
        return cb(tx);
      });

      const result = await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/file.jpg`,
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
          periodId: 'period-1',
        },
        timezone,
      );

      expect(result).toHaveProperty('periodId', 'period-1');
    });

    it('should throw EventPeriodNotFoundError for non-existent period', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn(),
          },
          day: { upsert: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        return cb(tx);
      });

      await expect(
        service.addMedia(
          userId,
          '2024-01-15',
          {
            s3Key: `uploads/${userId}/file.jpg`,
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
            periodId: 'nonexistent',
          },
          timezone,
        ),
      ).rejects.toThrow(EventPeriodNotFoundError);
    });

    it('should throw ValidationError when period does not cover the day', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2020-12-31T00:00:00Z'),
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn(),
          },
          day: { upsert: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(mockPeriod) },
        };
        return cb(tx);
      });

      await expect(
        service.addMedia(
          userId,
          '2024-01-15',
          {
            s3Key: `uploads/${userId}/file.jpg`,
            fileName: 'file.jpg',
            contentType: 'image/jpeg',
            size: 1024,
            periodId: 'period-1',
          },
          timezone,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should allow open-ended period (no endDate)', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: null,
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dayMedia: {
            count: jest.fn().mockResolvedValue(0),
            create: jest
              .fn()
              .mockResolvedValue({ ...mockMedia, periodId: 'period-1' }),
          },
          day: { upsert: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(mockPeriod) },
        };
        return cb(tx);
      });

      const result = await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/file.jpg`,
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
          periodId: 'period-1',
        },
        timezone,
      );

      expect(result).toHaveProperty('periodId', 'period-1');
    });

    it('should create media without periodId (backward compat)', async () => {
      const result = await service.addMedia(
        userId,
        '2024-01-15',
        {
          s3Key: `uploads/${userId}/file.jpg`,
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        },
        timezone,
      );

      expect(result).toHaveProperty('periodId', null);
    });
  });

  // ─── UPDATE MEDIA PERIOD ────────────────────────────────

  describe('updateMediaPeriod', () => {
    it('should throw MediaNotFoundError for non-existent media', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.updateMediaPeriod(userId, 'nonexistent', 'period-1'),
      ).rejects.toThrow(MediaNotFoundError);
    });

    it('should set periodId on media', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-12-31T00:00:00Z'),
      };

      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          day: { findUnique: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(mockPeriod) },
          dayMedia: {
            update: jest
              .fn()
              .mockResolvedValue({ ...mockMedia, periodId: 'period-1' }),
          },
        };
        return cb(tx);
      });

      const result = await service.updateMediaPeriod(
        userId,
        'media-1',
        'period-1',
      );

      expect(result).toHaveProperty('periodId', 'period-1');
    });

    it('should unset periodId when null', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue({
        ...mockMedia,
        periodId: 'period-1',
      } as any);
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          day: { findUnique: jest.fn() },
          eventPeriod: { findFirst: jest.fn() },
          dayMedia: {
            update: jest
              .fn()
              .mockResolvedValue({ ...mockMedia, periodId: null }),
          },
        };
        return cb(tx);
      });

      const result = await service.updateMediaPeriod(userId, 'media-1', null);

      expect(result).toHaveProperty('periodId', null);
    });

    it('should throw MediaNotFoundError when day record is missing', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          day: { findUnique: jest.fn().mockResolvedValue(null) },
          eventPeriod: { findFirst: jest.fn() },
          dayMedia: { update: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.updateMediaPeriod(userId, 'media-1', 'period-1'),
      ).rejects.toThrow(MediaNotFoundError);
    });

    it('should throw EventPeriodNotFoundError for non-existent period', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          day: { findUnique: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(null) },
          dayMedia: { update: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.updateMediaPeriod(userId, 'media-1', 'nonexistent'),
      ).rejects.toThrow(EventPeriodNotFoundError);
    });

    it('should throw ValidationError when period does not cover the day', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2020-06-30T00:00:00Z'),
      };

      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          day: { findUnique: jest.fn().mockResolvedValue(mockDay) },
          eventPeriod: { findFirst: jest.fn().mockResolvedValue(mockPeriod) },
          dayMedia: { update: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.updateMediaPeriod(userId, 'media-1', 'period-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─── DELETE — S3 FAILURE HANDLING ───────────────────────

  describe('deleteMedia — S3 failure resilience', () => {
    it('should not throw when S3 delete fails (best-effort)', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);
      s3Service.deleteObject.mockRejectedValue(new Error('S3 down'));

      await expect(
        service.deleteMedia(userId, 'media-1'),
      ).resolves.toBeUndefined();
      expect(mediaRepo.deleteById).toHaveBeenCalledWith('media-1');
    });
  });
});
