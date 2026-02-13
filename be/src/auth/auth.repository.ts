import { Injectable } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async createUser(data: { email: string; passwordHash: string; timezone: string }) {
    return this.prisma.user.create({ data });
  }

  async createGoogleUser(data: { email: string; googleId: string; avatarUrl: string | null }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        googleId: data.googleId,
        provider: AuthProvider.GOOGLE,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl: string | null) {
    // Link Google account without overwriting provider — preserve password login capability
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        avatarUrl: avatarUrl,
      },
    });
  }

  async completeOnboarding(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }
}
