import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDayStates(userId: string) {
    return this.prisma.dayState.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, score: true },
      orderBy: { order: 'asc' },
    });
  }

  async findAllDaysWithMood(userId: string) {
    return this.prisma.day.findMany({
      where: { userId, dayStateId: { not: null } },
      include: {
        dayState: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findAllDaysWithMediaCount(userId: string) {
    return this.prisma.day.findMany({
      where: { userId },
      select: {
        id: true,
        date: true,
        dayStateId: true,
        _count: { select: { media: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findAllEventPeriods(userId: string) {
    return this.prisma.eventPeriod.findMany({
      where: { eventGroup: { userId } },
      select: { startDate: true, endDate: true },
    });
  }

  async findDaysWithMoodInRange(userId: string, from: Date, to: Date) {
    return this.prisma.day.findMany({
      where: {
        userId,
        dayStateId: { not: null },
        date: { gte: from, lte: to },
      },
      include: {
        dayState: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findAllCategoriesWithPeriods(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        eventGroups: {
          select: {
            periods: {
              select: { startDate: true, endDate: true },
            },
          },
        },
      },
    });
  }
}
