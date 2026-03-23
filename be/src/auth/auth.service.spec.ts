import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  UnauthorizedError,
  UserCreationFailedError,
  ValidationError,
  GoogleAuthFailedError,
} from '../common/errors/app.error.js';
import type { GoogleProfile } from './strategies/google.strategy.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2b$12$placeholder',
    googleId: null,
    provider: 'LOCAL' as const,
    avatarUrl: null,
    timezone: 'UTC',
    onboardingCompleted: false,
    birthDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGoogleProfile: GoogleProfile = {
    email: 'google@example.com',
    googleId: 'google-123',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'new-user-id',
          ...data,
          provider: data.provider ?? 'LOCAL',
          googleId: data.googleId ?? null,
          avatarUrl: data.avatarUrl ?? null,
          onboardingCompleted: false,
          birthDate: null,
          createdAt: new Date(),
        })),
      },
      refreshToken: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: `rt-${Date.now()}`,
          ...data,
        })),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      subscription: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(),
    };

    // Default $transaction: run callback with tx that reuses outer mocks
    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        user: prisma.user,
        subscription: prisma.subscription,
      };
      return cb(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            completeOnboarding: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getTier: jest.fn().mockResolvedValue('FREE'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
  });

  // ─── REGISTRATION ──────────────────────────────────────────

  describe('register', () => {
    beforeAll(() => {
      jest.setTimeout(30_000);
    });

    afterAll(() => {
      jest.setTimeout(5_000);
    });

    it('should normalize email to lowercase and trim whitespace', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.register({
        email: '  Test@Example.COM  ',
        password: 'Password1',
      });

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@example.com' }),
        }),
      );
    });

    it('should reject duplicate email with ValidationError', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'Password1' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should hash password with bcrypt (12 rounds) before storing', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.register({
        email: 'new@example.com',
        password: 'Password1',
      });

      const createCall = prisma.user.create.mock.calls[0][0];
      const storedHash = createCall.data.passwordHash;

      // Verify it's a bcrypt hash with 12 rounds
      expect(storedHash).toMatch(/^\$2[ab]\$12\$/);
      // Verify the hash validates against the original password
      expect(await bcrypt.compare('Password1', storedHash)).toBe(true);
      // Verify a wrong password does NOT match
      expect(await bcrypt.compare('WrongPassword', storedHash)).toBe(false);
    });

    it('should default to UTC timezone when none provided', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.register({
        email: 'new@example.com',
        password: 'Password1',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timezone: 'UTC' }),
        }),
      );
    });

    it('should use provided timezone', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.register({
        email: 'new@example.com',
        password: 'Password1',
        timezone: 'Europe/Kyiv',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timezone: 'Europe/Kyiv' }),
        }),
      );
    });

    it('should return access_token, refresh_token, and user with required fields', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const result = await service.register({
        email: 'new@example.com',
        password: 'Password1',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toEqual(expect.any(String));
      expect(result.user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: 'new@example.com',
          timezone: 'UTC',
          onboardingCompleted: false,
        }),
      );
    });

    it('should generate JWT with sub and email payload', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.register({
        email: 'new@example.com',
        password: 'Password1',
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'new-user-id', email: 'new@example.com', timezone: 'UTC' },
        { expiresIn: '15m' },
      );
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────────

  describe('login', () => {
    it('should reject login when user not found', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'Password1',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should reject login for Google-only account (no passwordHash)', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
        provider: 'GOOGLE' as const,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should reject login with wrong password', async () => {
      const realHash = await bcrypt.hash('CorrectPassword1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword1',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should return tokens and user on correct password', async () => {
      const realHash = await bcrypt.hash('Password1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should serialize birthDate as YYYY-MM-DD string when set', async () => {
      const realHash = await bcrypt.hash('Password1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
        birthDate: new Date('1990-05-15T00:00:00.000Z'),
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result.user.birthDate).toBe('1990-05-15');
    });

    it('should return birthDate as null when not set', async () => {
      const realHash = await bcrypt.hash('Password1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result.user.birthDate).toBeNull();
    });

    it('should normalize email on login', async () => {
      const realHash = await bcrypt.hash('Password1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });

      await service.login({
        email: '  TEST@Example.COM ',
        password: 'Password1',
      });

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should return identical error for user-not-found and wrong-password (timing-safe)', async () => {
      // User not found
      authRepository.findUserByEmail.mockResolvedValue(null);
      let error1: any;
      try {
        await service.login({ email: 'x@y.com', password: 'Password1' });
      } catch (e) {
        error1 = e;
      }

      // Wrong password
      const hash = await bcrypt.hash('RightPass1', 12);
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });
      let error2: any;
      try {
        await service.login({
          email: 'test@example.com',
          password: 'WrongPass1',
        });
      } catch (e) {
        error2 = e;
      }

      // Same error class and message — attacker can't distinguish
      expect(error1).toBeInstanceOf(UnauthorizedError);
      expect(error2).toBeInstanceOf(UnauthorizedError);
      expect(error1.message).toBe(error2.message);
    });
  });

  // ─── REFRESH TOKEN ROTATION ────────────────────────────────

  describe('refresh', () => {
    it('should reject expired token and clean it up from DB', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-expired',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1000),
        userId: 'user-1',
        user: mockUser,
      });

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedError,
      );
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-expired' },
      });
    });

    it('should reject token not found in DB', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toThrow(
        UnauthorizedError,
      );
      // Should NOT attempt to delete when token doesn't exist
      expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
    });

    it('should rotate: delete old token and issue new pair', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-old',
        tokenHash: 'old-hash',
        expiresAt: futureDate,
        userId: 'user-1',
        user: mockUser,
      });

      const result = await service.refresh('valid-raw-token');

      // Old token must be deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-old' },
      });
      // New token must be created
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toEqual(expect.any(String));
    });

    it('should hash the raw token with SHA-256 for DB lookup', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      const rawToken = 'test-raw-token-value';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      await service.refresh(rawToken).catch(() => {});

      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { tokenHash: expectedHash },
        include: { user: true },
      });
    });

    it('should bind new JWT to correct user from stored token', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        expiresAt: futureDate,
        userId: 'user-1',
        user: mockUser,
      });

      const result = await service.refresh('raw-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com', timezone: 'UTC' },
        { expiresIn: '15m' },
      );
      expect(result.user.id).toBe('user-1');
    });

    it('should prevent replay attack: second use fails after rotation', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // First use: token exists
      prisma.refreshToken.findFirst.mockResolvedValueOnce({
        id: 'rt-1',
        tokenHash: 'hash',
        expiresAt: futureDate,
        userId: 'user-1',
        user: mockUser,
      });

      const result1 = await service.refresh('raw-token');
      expect(result1.access_token).toBeDefined();

      // Second use: token was deleted during rotation
      prisma.refreshToken.findFirst.mockResolvedValueOnce(null);

      await expect(service.refresh('raw-token')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should set new refresh token expiry ~7 days from now', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        expiresAt: futureDate,
        userId: 'user-1',
        user: mockUser,
      });

      await service.refresh('raw-token');

      const createCall = prisma.refreshToken.create.mock.calls[0][0];
      const expiry = createCall.data.expiresAt as Date;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const diff = expiry.getTime() - Date.now();

      expect(diff).toBeGreaterThan(sevenDaysMs - 5000);
      expect(diff).toBeLessThanOrEqual(sevenDaysMs);
    });
  });

  // ─── LOGOUT ────────────────────────────────────────────────

  describe('logout', () => {
    it('should delete refresh token by its SHA-256 hash', async () => {
      const rawToken = 'logout-token';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      await service.logout(rawToken);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: expectedHash },
      });
    });
  });

  // ─── GOOGLE LOGIN (transaction-based) ──────────────────────

  describe('googleLogin', () => {
    it('should return existing user when googleId matches', async () => {
      const googleUser = {
        ...mockUser,
        googleId: 'google-123',
        provider: 'GOOGLE' as const,
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValueOnce(googleUser),
            update: jest.fn(),
            create: jest.fn(),
          },
        };
        return cb(tx);
      });

      const result = await service.googleLogin(mockGoogleProfile);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should link Google to existing LOCAL user without overwriting provider', async () => {
      const localUser = {
        ...mockUser,
        provider: 'LOCAL' as const,
        avatarUrl: null,
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(null) // no googleId match
              .mockResolvedValueOnce(localUser), // email match
            update: jest.fn().mockResolvedValue({
              ...localUser,
              googleId: 'google-123',
              avatarUrl: mockGoogleProfile.avatarUrl,
            }),
            create: jest.fn(),
          },
        };
        const result = await cb(tx);
        // Verify update does NOT set provider — preserves LOCAL
        const updateData = tx.user.update.mock.calls[0]?.[0]?.data;
        expect(updateData).not.toHaveProperty('provider');
        return result;
      });

      await service.googleLogin(mockGoogleProfile);
    });

    it('should preserve existing avatarUrl when linking (nullish coalescing)', async () => {
      const userWithAvatar = { ...mockUser, avatarUrl: 'https://existing.jpg' };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(userWithAvatar),
            update: jest.fn().mockImplementation(({ data }) => ({
              ...userWithAvatar,
              ...data,
            })),
            create: jest.fn(),
          },
        };
        const result = await cb(tx);
        const updateData = tx.user.update.mock.calls[0][0].data;
        expect(updateData.avatarUrl).toBe('https://existing.jpg');
        return result;
      });

      await service.googleLogin(mockGoogleProfile);
    });

    it('should set Google avatarUrl when user has none', async () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: null };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(userWithoutAvatar),
            update: jest.fn().mockImplementation(({ data }) => ({
              ...userWithoutAvatar,
              ...data,
            })),
            create: jest.fn(),
          },
        };
        const result = await cb(tx);
        const updateData = tx.user.update.mock.calls[0][0].data;
        expect(updateData.avatarUrl).toBe(mockGoogleProfile.avatarUrl);
        return result;
      });

      await service.googleLogin(mockGoogleProfile);
    });

    it('should create new GOOGLE provider user when no existing user found', async () => {
      const newUser = {
        id: 'new-google-user',
        email: 'google@example.com',
        googleId: 'google-123',
        provider: 'GOOGLE',
        avatarUrl: mockGoogleProfile.avatarUrl,
        timezone: 'UTC',
        onboardingCompleted: false,
        birthDate: null,
        createdAt: new Date(),
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(null),
            update: jest.fn(),
            create: jest.fn().mockResolvedValue(newUser),
          },
        };
        const result = await cb(tx);
        const createData = tx.user.create.mock.calls[0][0].data;
        expect(createData.provider).toBe('GOOGLE');
        expect(createData.googleId).toBe('google-123');
        expect(createData.email).toBe('google@example.com');
        return result;
      });

      const result = await service.googleLogin(mockGoogleProfile);
      expect(result.user.email).toBe('google@example.com');
    });

    it('should normalize Google profile email to lowercase and trim', async () => {
      const uppercaseProfile: GoogleProfile = {
        email: '  Google@EXAMPLE.COM  ',
        googleId: 'google-456',
        avatarUrl: null,
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
            create: jest.fn().mockResolvedValue({
              id: 'user-new',
              email: 'google@example.com',
              timezone: 'UTC',
              onboardingCompleted: false,
              avatarUrl: null,
              createdAt: new Date(),
            }),
          },
        };
        return cb(tx);
      });

      const result = await service.googleLogin(uppercaseProfile);
      expect(result.user.email).toBe('google@example.com');
    });

    it('should wrap unexpected errors in UserCreationFailedError', async () => {
      prisma.$transaction.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.googleLogin(mockGoogleProfile)).rejects.toThrow(
        UserCreationFailedError,
      );
    });

    it('should re-throw GoogleAuthFailedError without wrapping', async () => {
      prisma.$transaction.mockRejectedValue(new GoogleAuthFailedError('test'));

      await expect(service.googleLogin(mockGoogleProfile)).rejects.toThrow(
        GoogleAuthFailedError,
      );
    });

    it('should re-throw UserCreationFailedError without wrapping', async () => {
      prisma.$transaction.mockRejectedValue(new UserCreationFailedError());

      await expect(service.googleLogin(mockGoogleProfile)).rejects.toThrow(
        UserCreationFailedError,
      );
    });
  });

  // ─── OAUTH CODE EXCHANGE ────────────────────────────────

  describe('storeOAuthCode / exchangeOAuthCode', () => {
    const tokenData = {
      access_token: 'jwt-token',
      refresh_token: 'rt-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        timezone: 'UTC',
        onboardingCompleted: false,
        tier: 'FREE',
        createdAt: new Date().toISOString(),
      },
    };

    it('should store and retrieve OAuth code', () => {
      const code = service.storeOAuthCode(tokenData);

      expect(code).toEqual(expect.any(String));
      expect(code.length).toBe(64); // 32 bytes hex

      const result = service.exchangeOAuthCode(code);
      expect(result).toEqual(tokenData);
    });

    it('should invalidate code after single use', () => {
      const code = service.storeOAuthCode(tokenData);

      service.exchangeOAuthCode(code);

      expect(() => service.exchangeOAuthCode(code)).toThrow(UnauthorizedError);
    });

    it('should reject unknown code', () => {
      expect(() => service.exchangeOAuthCode('invalid-code')).toThrow(
        UnauthorizedError,
      );
    });

    it('should reject expired code', () => {
      const code = service.storeOAuthCode(tokenData);

      // Fast-forward time past the 60s TTL
      jest.useFakeTimers();
      jest.advanceTimersByTime(61_000);

      expect(() => service.exchangeOAuthCode(code)).toThrow(UnauthorizedError);

      jest.useRealTimers();
    });
  });

  // ─── COMPLETE ONBOARDING ────────────────────────────────

  describe('completeOnboarding', () => {
    it('should call repository and return user response', async () => {
      const updatedUser = {
        ...mockUser,
        onboardingCompleted: true,
      };
      authRepository.completeOnboarding.mockResolvedValue(updatedUser);

      const result = await service.completeOnboarding('user-1');

      expect(authRepository.completeOnboarding).toHaveBeenCalledWith('user-1');
      expect(result.id).toBe('user-1');
      expect(result.onboardingCompleted).toBe(true);
    });
  });
});
