import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  GoogleAuthFailedError,
  UnauthorizedError,
  UserCreationFailedError,
  ValidationError,
} from '../common/errors/app.error.js';
import type { GoogleProfile } from './strategies/google.strategy.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { AuditLoggerService } from '../common/services/audit-logger.service.js';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const OAUTH_CODE_TTL_MS = 60_000;
const OAUTH_CODES_MAX_SIZE = 1_000;
const OAUTH_CLEANUP_INTERVAL_MS = 30_000;

// Pre-computed bcrypt hash for constant-time comparison when user doesn't exist
const DUMMY_HASH =
  '$2b$12$LJ3m4ys3Lk0TSwHlvPkSxOSZSGwcF5s8F1YMwXBPjKzLy4qXzKe7W';

interface OAuthTokenData {
  access_token: string;
  refresh_token: string;
  user: AuthUserData;
}

interface AuthUserData {
  id: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  onboardingCompleted: boolean;
  tier: string;
  birthDate: string | null;
  createdAt: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly oauthCodes = new Map<
    string,
    { data: OAuthTokenData; expiresAt: number }
  >();
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly audit: AuditLoggerService,
  ) {
    // Periodically clean up expired OAuth codes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.oauthCodes) {
        if (entry.expiresAt < now) {
          this.oauthCodes.delete(key);
        }
      }
    }, OAUTH_CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  private async buildUserResponse(user: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    timezone: string;
    onboardingCompleted: boolean;
    birthDate?: Date | null;
    createdAt: Date;
  }): Promise<AuthUserData> {
    const tier = await this.subscriptionsService.getTier(user.id);
    return {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
      tier,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().split('T')[0]
        : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ValidationError({ email: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Atomic: create user + provision FREE subscription in a single transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          timezone: dto.timezone ?? 'UTC',
        },
      });
      await tx.subscription.upsert({
        where: { userId: newUser.id },
        create: { userId: newUser.id, tier: 'FREE', status: 'ACTIVE' },
        update: {},
      });
      return newUser;
    });

    const accessToken = this.generateAccessToken(
      user.id,
      user.email,
      user.timezone,
    );
    const refreshToken = await this.createRefreshToken(user.id);

    this.audit.log({
      event: 'USER_REGISTERED',
      userId: user.id,
      email: dto.email,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: await this.buildUserResponse(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.authRepository.findUserByEmail(email);

    // Always run bcrypt.compare to prevent timing-based user enumeration
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !user.passwordHash || !isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(
      user.id,
      user.email,
      user.timezone,
    );
    const refreshToken = await this.createRefreshToken(user.id);

    this.audit.log({
      event: 'USER_LOGGED_IN',
      userId: user.id,
      email: dto.email,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: await this.buildUserResponse(user),
    };
  }

  async googleLogin(profile: GoogleProfile) {
    const email = profile.email.toLowerCase().trim();

    try {
      // Use transaction to prevent race conditions during user lookup/create
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Check if user with this googleId already exists
        const existingByGoogle = await tx.user.findUnique({
          where: { googleId: profile.googleId },
        });
        if (existingByGoogle) {
          return {
            user: existingByGoogle,
            action: 'existing_google' as const,
          };
        }

        // 2. Check if user with same email exists → link Google account
        const existingByEmail = await tx.user.findUnique({
          where: { email },
        });
        if (existingByEmail) {
          // Link Google account without overwriting provider — preserve password login
          const linked = await tx.user.update({
            where: { id: existingByEmail.id },
            data: {
              googleId: profile.googleId,
              avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
            },
          });
          return {
            user: linked,
            action: 'linked' as const,
          };
        }

        // 3. Create new Google user
        const newUser = await tx.user.create({
          data: {
            email,
            googleId: profile.googleId,
            provider: 'GOOGLE',
            avatarUrl: profile.avatarUrl,
          },
        });
        return {
          user: newUser,
          action: 'created' as const,
        };
      });

      const accessToken = this.generateAccessToken(
        result.user.id,
        result.user.email,
        result.user.timezone,
      );
      const refreshToken = await this.createRefreshToken(result.user.id);

      this.audit.log({
        event: 'GOOGLE_LOGIN',
        userId: result.user.id,
        email: profile.email,
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: await this.buildUserResponse(result.user),
      };
    } catch (error) {
      if (
        error instanceof GoogleAuthFailedError ||
        error instanceof UserCreationFailedError
      ) {
        throw error;
      }
      this.logger.error('Google login failed', error);
      throw new UserCreationFailedError();
    }
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Rotate: delete the old token and issue a new pair
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const accessToken = this.generateAccessToken(
      stored.user.id,
      stored.user.email,
      stored.user.timezone,
    );
    const newRefreshToken = await this.createRefreshToken(stored.user.id);

    this.audit.log({ event: 'TOKEN_REFRESHED', userId: stored.user.id });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: await this.buildUserResponse(stored.user),
    };
  }

  async logout(rawToken: string, userId: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    this.audit.log({ event: 'USER_LOGGED_OUT', userId });
  }

  storeOAuthCode(data: OAuthTokenData): string {
    // Enforce max size to prevent memory exhaustion
    if (this.oauthCodes.size >= OAUTH_CODES_MAX_SIZE) {
      // Evict oldest entries (first 20%)
      const evictCount = Math.ceil(OAUTH_CODES_MAX_SIZE * 0.2);
      const iterator = this.oauthCodes.keys();
      for (let i = 0; i < evictCount; i++) {
        const key = iterator.next().value;
        if (key) this.oauthCodes.delete(key);
      }
    }

    const code = randomBytes(32).toString('hex');
    this.oauthCodes.set(code, {
      data,
      expiresAt: Date.now() + OAUTH_CODE_TTL_MS,
    });
    return code;
  }

  exchangeOAuthCode(code: string): OAuthTokenData {
    const entry = this.oauthCodes.get(code);
    this.oauthCodes.delete(code);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedError('Invalid or expired OAuth code');
    }

    return entry.data;
  }

  async completeOnboarding(userId: string) {
    const user = await this.authRepository.completeOnboarding(userId);
    return this.buildUserResponse(user);
  }

  private generateAccessToken(
    userId: string,
    email: string,
    timezone: string,
  ): string {
    return this.jwtService.sign(
      { sub: userId, email, timezone },
      { expiresIn: '15m' },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    // Opportunistically clean up expired tokens for this user
    this.prisma.refreshToken
      .deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      })
      .catch((err) =>
        this.logger.warn(`Failed to clean expired tokens: ${err}`),
      );

    return rawToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
