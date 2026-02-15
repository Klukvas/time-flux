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
import { FutureDateError } from '../common/errors/app.error.js';

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
  let authRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    daysRepo = {
      upsert: jest.fn(),
      upsertLocation: jest.fn(),
      findByUserIdAndDateRange: jest.fn(),
    };

    authRepo = {
      findUserById: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaysService,
        { provide: DaysRepository, useValue: daysRepo },
        { provide: DayStatesRepository, useValue: { findByIdAndUserId: jest.fn() } },
        { provide: AuthRepository, useValue: authRepo },
        { provide: S3Service, useValue: { getPresignedReadUrl: jest.fn().mockResolvedValue('https://s3/mock') } },
      ],
    }).compile();

    service = module.get(DaysService);
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
        service.updateLocation(USER_ID, futureDate, { locationName: 'Future Place' }),
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
});
