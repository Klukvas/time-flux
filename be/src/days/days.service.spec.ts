// Mock S3Service module before imports to avoid uuid ESM issue
jest.mock('../s3/s3.service.js', () => ({
  S3Service: class MockS3Service {
    getPresignedReadUrl = jest.fn().mockResolvedValue('https://s3/mock');
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DaysService } from './days.service.js';
import { DaysRepository } from './days.repository.js';
import { DayStatesRepository } from '../day-states/day-states.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DayStateNotFoundError,
  FutureDateError,
  InvalidDateRangeError,
  MediaNotFoundError,
} from '../common/errors/app.error.js';

// ─── Mock Data ───────────────────────────────────────────────

const USER_ID = 'user-1';
const DATE_STR = '2025-01-15';
const DATE_OBJ = new Date('2025-01-15T00:00:00Z');

const mockUser = {
  id: USER_ID,
  email: 'test@example.com',
  timezone: 'UTC',
};

const mockDay = {
  id: 'day-1',
  userId: USER_ID,
  date: DATE_OBJ,
  dayStateId: null,
  mainMediaId: null,
  locationName: null,
  latitude: null,
  longitude: null,
  dayState: null,
  media: [],
};

const mockDayWithLocation = {
  ...mockDay,
  locationName: 'Kyiv, Ukraine',
  latitude: 50.4501,
  longitude: 30.5234,
};

// ─── Tests ───────────────────────────────────────────────────

describe('DaysService', () => {
  let service: DaysService;
  let daysRepo: Record<string, jest.Mock>;
  let dayStatesRepo: Record<string, jest.Mock>;
  let authRepo: Record<string, jest.Mock>;
  let prismaMock: { dayMedia: { findFirst: jest.Mock } };

  beforeEach(async () => {
    daysRepo = {
      upsert: jest.fn(),
      upsertLocation: jest.fn(),
      findByUserIdAndDateRange: jest.fn(),
    };

    dayStatesRepo = {
      findByIdAndUserId: jest.fn(),
    };

    authRepo = {
      findUserById: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaysService,
        { provide: DaysRepository, useValue: daysRepo },
        { provide: DayStatesRepository, useValue: dayStatesRepo },
        { provide: AuthRepository, useValue: authRepo },
        {
          provide: S3Service,
          useValue: {
            getPresignedReadUrl: jest.fn().mockResolvedValue('https://s3/mock'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            dayMedia: { findFirst: jest.fn().mockResolvedValue(null) },
          },
        },
      ],
    }).compile();

    service = module.get(DaysService);
    prismaMock = module.get(PrismaService) as any;
  });

  // ─── updateLocation ──────────────────────────────────────

  describe('updateLocation', () => {
    it('should update location with name and coordinates', async () => {
      daysRepo.upsertLocation.mockResolvedValue(mockDayWithLocation);

      const result = await service.updateLocation(USER_ID, DATE_STR, {
        locationName: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
      });

      expect(result.locationName).toBe('Kyiv, Ukraine');
      expect(result.latitude).toBe(50.4501);
      expect(result.longitude).toBe(30.5234);
      expect(daysRepo.upsertLocation).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        locationName: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
      });
    });

    it('should clear location when all fields are null', async () => {
      daysRepo.upsertLocation.mockResolvedValue(mockDay);

      const result = await service.updateLocation(USER_ID, DATE_STR, {
        locationName: null,
        latitude: null,
        longitude: null,
      });

      expect(result.locationName).toBeNull();
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
      expect(daysRepo.upsertLocation).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        locationName: null,
        latitude: null,
        longitude: null,
      });
    });

    it('should reject future dates', async () => {
      const futureDate = '2099-12-31';
      await expect(
        service.updateLocation(USER_ID, futureDate, {
          locationName: 'Future Place',
        }),
      ).rejects.toThrow(FutureDateError);
    });

    it('should upsert day if it does not exist (passes to repo)', async () => {
      daysRepo.upsertLocation.mockResolvedValue(mockDayWithLocation);

      await service.updateLocation(USER_ID, DATE_STR, {
        locationName: 'New York',
      });

      expect(daysRepo.upsertLocation).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        locationName: 'New York',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('should update only location name when coordinates are not provided', async () => {
      const dayWithName = { ...mockDay, locationName: 'London' };
      daysRepo.upsertLocation.mockResolvedValue(dayWithName);

      const result = await service.updateLocation(USER_ID, DATE_STR, {
        locationName: 'London',
      });

      expect(result.locationName).toBe('London');
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });
  });

  // ─── formatDay (location fields) ─────────────────────────

  describe('formatDay includes location fields', () => {
    it('should return location fields in day response', async () => {
      daysRepo.upsertLocation.mockResolvedValue(mockDayWithLocation);

      const result = await service.updateLocation(USER_ID, DATE_STR, {
        locationName: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'day-1',
          date: '2025-01-15',
          locationName: 'Kyiv, Ukraine',
          latitude: 50.4501,
          longitude: 30.5234,
        }),
      );
    });

    it('should return null location fields when not set', async () => {
      daysRepo.upsertLocation.mockResolvedValue(mockDay);

      const result = await service.updateLocation(USER_ID, DATE_STR, {
        locationName: null,
        latitude: null,
        longitude: null,
      });

      expect(result.locationName).toBeNull();
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });
  });

  // ─── upsert ────────────────────────────────────────────────

  describe('upsert', () => {
    it('should create day with dayStateId', async () => {
      dayStatesRepo.findByIdAndUserId.mockResolvedValue({
        id: 'ds-1',
        name: 'Happy',
        color: '#00FF00',
      });
      daysRepo.upsert.mockResolvedValue({
        ...mockDay,
        dayStateId: 'ds-1',
        dayState: { id: 'ds-1', name: 'Happy', color: '#00FF00' },
      });

      const result = await service.upsert(USER_ID, DATE_STR, {
        dayStateId: 'ds-1',
      });

      expect(result.date).toBe('2025-01-15');
      expect(result.dayState).toEqual({
        id: 'ds-1',
        name: 'Happy',
        color: '#00FF00',
      });
      expect(daysRepo.upsert).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        dayStateId: 'ds-1',
        mainMediaId: undefined,
        comment: undefined,
      });
    });

    it('should create day without dayStateId', async () => {
      daysRepo.upsert.mockResolvedValue(mockDay);

      const result = await service.upsert(USER_ID, DATE_STR, {});

      expect(result.dayState).toBeNull();
      expect(daysRepo.upsert).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        dayStateId: undefined,
        mainMediaId: undefined,
        comment: undefined,
      });
    });

    it('should throw DayStateNotFoundError when dayStateId does not exist', async () => {
      dayStatesRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.upsert(USER_ID, DATE_STR, { dayStateId: 'nonexistent' }),
      ).rejects.toThrow(DayStateNotFoundError);
    });

    it('should reject future dates', async () => {
      await expect(
        service.upsert(USER_ID, '2099-12-31', { dayStateId: 'ds-1' }),
      ).rejects.toThrow(FutureDateError);
    });

    it('should set mainMediaId', async () => {
      prismaMock.dayMedia.findFirst.mockResolvedValue({
        id: 'media-1',
        userId: USER_ID,
      });
      daysRepo.upsert.mockResolvedValue({ ...mockDay, mainMediaId: 'media-1' });

      const result = await service.upsert(USER_ID, DATE_STR, {
        mainMediaId: 'media-1',
      });

      expect(result.mainMediaId).toBe('media-1');
      expect(daysRepo.upsert).toHaveBeenCalledWith(USER_ID, DATE_OBJ, {
        dayStateId: undefined,
        mainMediaId: 'media-1',
        comment: undefined,
      });
    });

    it('should throw MediaNotFoundError when mainMediaId does not belong to user', async () => {
      prismaMock.dayMedia.findFirst.mockResolvedValue(null);

      await expect(
        service.upsert(USER_ID, DATE_STR, { mainMediaId: 'foreign-media' }),
      ).rejects.toThrow(MediaNotFoundError);
    });

    it('should format media with presigned URLs in response', async () => {
      const dayWithMedia = {
        ...mockDay,
        media: [
          {
            id: 'm-1',
            s3Key: 'uploads/user-1/photo.jpg',
            fileName: 'photo.jpg',
            contentType: 'image/jpeg',
            size: 1024,
            createdAt: new Date('2025-01-15T10:00:00Z'),
          },
        ],
      };
      daysRepo.upsert.mockResolvedValue(dayWithMedia);

      const result = await service.upsert(USER_ID, DATE_STR, {});

      expect(result.media).toHaveLength(1);
      expect(result.media[0]).toEqual(
        expect.objectContaining({
          id: 'm-1',
          url: 'https://s3/mock',
          fileName: 'photo.jpg',
        }),
      );
    });
  });

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return days for a date range', async () => {
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([mockDay]);

      const result = await service.findAll(USER_ID, {
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-01-15');
      expect(daysRepo.findByUserIdAndDateRange).toHaveBeenCalledWith(
        USER_ID,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T00:00:00Z'),
      );
    });

    it('should throw InvalidDateRangeError when from > to', async () => {
      await expect(
        service.findAll(USER_ID, { from: '2025-12-31', to: '2025-01-01' }),
      ).rejects.toThrow(InvalidDateRangeError);
    });

    it('should return empty array when no days exist', async () => {
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([]);

      const result = await service.findAll(USER_ID, {
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result).toEqual([]);
    });

    it('should format media with presigned URLs for each day', async () => {
      const dayWithMedia = {
        ...mockDay,
        media: [
          {
            id: 'm-1',
            s3Key: 'uploads/user-1/img.png',
            fileName: 'img.png',
            contentType: 'image/png',
            size: 2048,
            createdAt: new Date('2025-01-15T12:00:00Z'),
          },
        ],
      };
      daysRepo.findByUserIdAndDateRange.mockResolvedValue([dayWithMedia]);

      const result = await service.findAll(USER_ID, {
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(result[0].media[0].url).toBe('https://s3/mock');
    });
  });

  // ─── getUserTimezone ───────────────────────────────────────

  describe('getUserTimezone', () => {
    it('should default to UTC when user has no timezone', async () => {
      authRepo.findUserById.mockResolvedValue({
        ...mockUser,
        timezone: undefined,
      });
      daysRepo.upsert.mockResolvedValue(mockDay);

      const result = await service.upsert(USER_ID, DATE_STR, {});

      expect(result.date).toBe('2025-01-15');
    });

    it('should default to UTC when user not found', async () => {
      authRepo.findUserById.mockResolvedValue(null);
      daysRepo.upsert.mockResolvedValue(mockDay);

      const result = await service.upsert(USER_ID, DATE_STR, {});

      expect(result.date).toBe('2025-01-15');
    });
  });
});
