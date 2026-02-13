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

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ValidationError({ email: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        timezone: dto.timezone ?? 'UTC',
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, timezone: user.timezone, onboardingCompleted: user.onboardingCompleted },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, timezone: user.timezone, onboardingCompleted: user.onboardingCompleted },
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

      const accessToken = this.generateAccessToken(result.user.id, result.user.email);
      const refreshToken = await this.createRefreshToken(result.user.id);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          timezone: result.user.timezone,
          onboardingCompleted: result.user.onboardingCompleted,
        },
      };
    } catch (error) {
      if (error instanceof GoogleAuthFailedError || error instanceof UserCreationFailedError) {
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

    const accessToken = this.generateAccessToken(stored.user.id, stored.user.email);
    const newRefreshToken = await this.createRefreshToken(stored.user.id);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        avatarUrl: stored.user.avatarUrl,
        timezone: stored.user.timezone,
        onboardingCompleted: stored.user.onboardingCompleted,
      },
    };
  }

  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async completeOnboarding(userId: string) {
    const user = await this.authRepository.completeOnboarding(userId);
    return {
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  private generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email }, { expiresIn: '15m' });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return rawToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
