import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthRepository', () => {
  let repo: AuthRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repo = module.get(AuthRepository);
  });

  // ─── findUserByEmail ────────────────────────────────────────

  describe('findUserByEmail', () => {
    it('should call prisma.user.findUnique with email as unique lookup', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findUserByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findUserByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  // ─── findUserById ───────────────────────────────────────────

  describe('findUserById', () => {
    it('should call prisma.user.findUnique with id as unique lookup', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findUserById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user id does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findUserById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  // ─── completeOnboarding ─────────────────────────────────────

  describe('completeOnboarding', () => {
    it('should call prisma.user.update to set onboardingCompleted to true', async () => {
      const mockUser = { id: 'user-1', onboardingCompleted: true };
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await repo.completeOnboarding('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { onboardingCompleted: true },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
