import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async createFree(userId: string) {
    return this.prisma.subscription.create({
      data: { userId, tier: 'FREE', status: 'ACTIVE' },
    });
  }

  async upsertFree(userId: string) {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, tier: 'FREE', status: 'ACTIVE' },
      update: {},
    });
  }

  async updateByUserId(
    userId: string,
    data: {
      tier?: 'FREE' | 'PRO' | 'PREMIUM';
      status?: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
      paddleCustomerId?: string;
      paddleSubscriptionId?: string;
      currentPeriodEnd?: Date | null;
      canceledAt?: Date | null;
    },
  ) {
    return this.prisma.subscription.update({ where: { userId }, data });
  }

  async updateByPaddleSubscriptionId(
    paddleSubscriptionId: string,
    data: {
      tier?: 'FREE' | 'PRO' | 'PREMIUM';
      status?: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
      currentPeriodEnd?: Date | null;
      canceledAt?: Date | null;
    },
  ) {
    return this.prisma.subscription.update({
      where: { paddleSubscriptionId },
      data,
    });
  }

  async findByPaddleCustomerId(paddleCustomerId: string) {
    return this.prisma.subscription.findUnique({
      where: { paddleCustomerId },
    });
  }
}
