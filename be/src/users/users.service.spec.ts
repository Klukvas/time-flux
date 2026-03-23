import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import {
  ValidationError,
  FeatureLockedError,
} from '../common/errors/app.error.js';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: null,
    googleId: null,
    provider: 'LOCAL' as const,
    avatarUrl: null,
    timezone: 'UTC',
    onboardingCompleted: true,
    birthDate: null as Date | null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            updateBirthDate: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            assertFeatureAccess: jest.fn(),
            getTier: jest.fn().mockResolvedValue('PRO'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
    subscriptionsService = module.get(SubscriptionsService);
  });

  describe('updateProfile — birthDate', () => {
    it('should set birthDate for PRO user', async () => {
      const updatedUser = { ...mockUser, birthDate: new Date('1990-05-15') };
      usersRepository.updateBirthDate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        birthDate: '1990-05-15',
      });

      expect(subscriptionsService.assertFeatureAccess).toHaveBeenCalledWith(
        'user-1',
        'birthDate',
      );
      expect(usersRepository.updateBirthDate).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
      );
      expect(result.birthDate).toBe('1990-05-15');
    });

    it('should throw FeatureLockedError for FREE user', async () => {
      subscriptionsService.assertFeatureAccess.mockRejectedValue(
        new FeatureLockedError({ feature: 'birthDate', tier: 'FREE' }),
      );

      await expect(
        service.updateProfile('user-1', { birthDate: '1990-05-15' }),
      ).rejects.toThrow(FeatureLockedError);
    });

    it('should clear birthDate (set to null) for PRO user', async () => {
      const updatedUser = { ...mockUser, birthDate: null };
      usersRepository.updateBirthDate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        birthDate: null,
      });

      expect(usersRepository.updateBirthDate).toHaveBeenCalledWith(
        'user-1',
        null,
      );
      expect(result.birthDate).toBeNull();
    });

    it('should reject future birth date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      await expect(
        service.updateProfile('user-1', { birthDate: futureDate }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject user under 13 years old', async () => {
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 12);
      const youngDate = tooYoung.toISOString().split('T')[0];

      await expect(
        service.updateProfile('user-1', { birthDate: youngDate }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject birth date more than 130 years ago', async () => {
      await expect(
        service.updateProfile('user-1', { birthDate: '1890-01-01' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should accept exactly 13 years old today', async () => {
      const exactly13 = new Date();
      exactly13.setFullYear(exactly13.getFullYear() - 13);
      const dateStr = exactly13.toISOString().split('T')[0];

      const updatedUser = {
        ...mockUser,
        birthDate: new Date(dateStr),
      };
      usersRepository.updateBirthDate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        birthDate: dateStr,
      });

      expect(result.birthDate).toBe(dateStr);
    });

    it('should reject invalid date format', async () => {
      await expect(
        service.updateProfile('user-1', { birthDate: 'not-a-date' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should return current profile when no fields provided', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.updateProfile('user-1', {});

      expect(result.id).toBe('user-1');
      expect(result.birthDate).toBeNull();
    });
  });
});
