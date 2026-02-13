import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const categorySelect = { select: { id: true, name: true, color: true } } as const;

const groupInclude = {
  category: categorySelect,
  periods: { orderBy: { startDate: 'desc' as const } },
} as const;

const periodInclude = {
  eventGroup: {
    include: {
      category: categorySelect,
    },
  },
} as const;

@Injectable()
export class EventGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── EventGroup ────────────────────────────────────────────

  async findGroupByIdAndUserId(id: string, userId: string, tx?: any) {
    const client = tx ?? this.prisma;
    return client.eventGroup.findFirst({
      where: { id, userId },
      include: groupInclude,
    });
  }

  async findAllGroupsByUserId(userId: string) {
    return this.prisma.eventGroup.findMany({
      where: { userId },
      include: groupInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createGroup(
    data: { userId: string; categoryId: string; title: string; description?: string },
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    return client.eventGroup.create({
      data,
      include: groupInclude,
    });
  }

  async updateGroup(
    id: string,
    data: { categoryId?: string; title?: string; description?: string },
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    return client.eventGroup.update({
      where: { id },
      data,
      include: groupInclude,
    });
  }

  async deleteGroup(id: string) {
    return this.prisma.eventGroup.delete({ where: { id } });
  }

  async countPeriodsForGroup(groupId: string): Promise<number> {
    return this.prisma.eventPeriod.count({ where: { eventGroupId: groupId } });
  }

  // ─── EventPeriod ───────────────────────────────────────────

  async findPeriodById(id: string, tx?: any) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.findFirst({
      where: { id },
      include: periodInclude,
    });
  }

  async findPeriodByIdAndUserId(id: string, userId: string, tx?: any) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.findFirst({
      where: { id, eventGroup: { userId } },
      include: periodInclude,
    });
  }

  async findActivePeriodForGroup(groupId: string, excludePeriodId?: string, tx?: any) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.findFirst({
      where: {
        eventGroupId: groupId,
        endDate: null,
        ...(excludePeriodId ? { id: { not: excludePeriodId } } : {}),
      },
    });
  }

  async createPeriod(
    data: { eventGroupId: string; startDate: Date; endDate?: Date; comment?: string },
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.create({
      data,
      include: periodInclude,
    });
  }

  async updatePeriod(
    id: string,
    data: { startDate?: Date; endDate?: Date | null; comment?: string },
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.update({
      where: { id },
      data,
      include: periodInclude,
    });
  }

  async deletePeriod(id: string) {
    return this.prisma.eventPeriod.delete({ where: { id } });
  }

  async findClosedPeriodsForGroup(groupId: string, excludePeriodId?: string, tx?: any) {
    const client = tx ?? this.prisma;
    return client.eventPeriod.findMany({
      where: {
        eventGroupId: groupId,
        endDate: { not: null },
        ...(excludePeriodId ? { id: { not: excludePeriodId } } : {}),
      },
      select: { id: true, startDate: true, endDate: true },
    });
  }

  // ─── Timeline / Memories queries ──────────────────────────

  async findPeriodsWithDateRange(userId: string, from?: Date, to?: Date) {
    return this.prisma.eventPeriod.findMany({
      where: {
        eventGroup: { userId },
        ...(from || to
          ? {
              AND: [
                ...(to ? [{ startDate: { lte: to } }] : []),
                ...(from
                  ? [
                      {
                        OR: [
                          { endDate: { gte: from } },
                          { endDate: null },
                        ],
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      include: periodInclude,
      orderBy: { startDate: 'desc' },
    });
  }

  async findPeriodsOverlapping(userId: string, rangeStart: Date, rangeEnd: Date) {
    return this.prisma.eventPeriod.findMany({
      where: {
        eventGroup: { userId },
        startDate: { lte: rangeEnd },
        OR: [
          { endDate: { gte: rangeStart } },
          { endDate: null },
        ],
      },
      include: periodInclude,
      orderBy: { startDate: 'desc' },
    });
  }
}
