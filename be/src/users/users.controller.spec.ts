import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserResponse = {
    id: 'user-1',
    email: 'test@example.com',
    avatarUrl: undefined,
    timezone: 'UTC',
    onboardingCompleted: true,
    tier: 'PRO',
    birthDate: '1990-05-15',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            updateProfile: jest.fn().mockResolvedValue(mockUserResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should call service with userId and dto', async () => {
      const dto = { birthDate: '1990-05-15' };
      const jwtPayload = { sub: 'user-1', email: 'test@example.com', timezone: 'UTC' };

      const result = await controller.updateProfile(jwtPayload, dto);

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockUserResponse);
    });

    it('should pass null birthDate to service for clearing', async () => {
      const dto = { birthDate: null as string | null };
      const jwtPayload = { sub: 'user-1', email: 'test@example.com', timezone: 'UTC' };

      await controller.updateProfile(jwtPayload, dto);

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
        birthDate: null,
      });
    });
  });
});
