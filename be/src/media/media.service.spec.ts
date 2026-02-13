jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service.js';
import { MediaRepository } from './media.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { FutureDateError, MediaNotFoundError } from '../common/errors/app.error.js';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<MediaRepository>;
  let authRepo: jest.Mocked<AuthRepository>;
  let s3Service: jest.Mocked<S3Service>;

  const userId = 'user-1';

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
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserById: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getPresignedReadUrl: jest.fn().mockResolvedValue('https://s3.example.com/read'),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MediaService);
    mediaRepo = module.get(MediaRepository);
    authRepo = module.get(AuthRepository);
    s3Service = module.get(S3Service);
  });

  // ─── FUTURE DATE VALIDATION ────────────────────────────────

  describe('addMedia — future date validation', () => {
    it('should reject dates more than 1 day in the future', async () => {
      // Set a date far in the future
      await expect(
        service.addMedia(userId, '2099-12-31', {
          s3Key: 'uploads/user-1/file.jpg',
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        }),
      ).rejects.toThrow(FutureDateError);
    });

    it('should allow today date', async () => {
      const today = new Date().toISOString().split('T')[0];

      const result = await service.addMedia(userId, today, {
        s3Key: 'uploads/user-1/file.jpg',
        fileName: 'file.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });

      expect(result).toHaveProperty('id');
    });
  });

  // ─── AUTO COVER SELECTION ──────────────────────────────────

  describe('addMedia — auto cover photo', () => {
    it('should auto-set first image as cover when no cover exists', async () => {
      mediaRepo.upsertDay.mockResolvedValue({ ...mockDay, mainMediaId: null } as any);

      await service.addMedia(userId, '2024-01-15', {
        s3Key: 'uploads/user-1/photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });

      expect(mediaRepo.setMainMedia).toHaveBeenCalledWith('day-1', 'media-1');
    });

    it('should NOT override existing cover photo', async () => {
      mediaRepo.upsertDay.mockResolvedValue({
        ...mockDay,
        mainMediaId: 'existing-cover',
      } as any);

      await service.addMedia(userId, '2024-01-15', {
        s3Key: 'uploads/user-1/photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });

      expect(mediaRepo.setMainMedia).not.toHaveBeenCalled();
    });

    it('should NOT auto-set cover for video uploads', async () => {
      mediaRepo.upsertDay.mockResolvedValue({ ...mockDay, mainMediaId: null } as any);

      await service.addMedia(userId, '2024-01-15', {
        s3Key: 'uploads/user-1/video.mp4',
        fileName: 'video.mp4',
        contentType: 'video/mp4',
        size: 10000000,
      });

      expect(mediaRepo.setMainMedia).not.toHaveBeenCalled();
    });
  });

  // ─── DAY UPSERT ───────────────────────────────────────────

  describe('addMedia — day upsert', () => {
    it('should upsert day record before creating media', async () => {
      await service.addMedia(userId, '2024-01-15', {
        s3Key: 'uploads/user-1/file.jpg',
        fileName: 'file.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });

      expect(mediaRepo.upsertDay).toHaveBeenCalledWith(
        userId,
        new Date('2024-01-15T00:00:00Z'),
      );
      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ dayId: 'day-1' }),
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

      expect(mediaRepo.clearMainMediaIfMatch).toHaveBeenCalledWith('day-1', 'media-1');
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

      expect(callOrder).toEqual(['s3', 'db']);
    });

    it('should pass correct S3 key to delete', async () => {
      mediaRepo.findByIdAndUser.mockResolvedValue(mockMedia as any);

      await service.deleteMedia(userId, 'media-1');

      expect(s3Service.deleteObject).toHaveBeenCalledWith('uploads/user-1/abc.jpg');
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

  // ─── TIMEZONE-AWARE FUTURE DATE CHECK ──────────────────────

  describe('addMedia — timezone-aware validation', () => {
    it('should use user timezone for future date check', async () => {
      authRepo.findUserById.mockResolvedValue({ timezone: 'Pacific/Auckland' } as any);

      // A date that might be "tomorrow" in UTC but "today" in NZ timezone won't matter
      // for 2099, it's always future regardless
      await expect(
        service.addMedia(userId, '2099-01-01', {
          s3Key: 'uploads/user-1/file.jpg',
          fileName: 'file.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        }),
      ).rejects.toThrow(FutureDateError);
    });
  });
});
