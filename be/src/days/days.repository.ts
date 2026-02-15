import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DaysRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly dayInclude = {
    dayState: { select: { id: true, name: true, color: true } },
    media: {
      select: { id: true, s3Key: true, fileName: true, contentType: true, size: true, createdAt: true },
      orderBy: { createdAt: 'asc' as const },
    },
  };

  async upsert(userId: string, date: Date, data: { dayStateId?: string | null; mainMediaId?: string | null }) {
    const update: Record<string, unknown> = {};
    if (data.dayStateId !== undefined) update.dayStateId = data.dayStateId;
    if (data.mainMediaId !== undefined) update.mainMediaId = data.mainMediaId;

    return this.prisma.day.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...update },
      update,
      include: this.dayInclude,
    });
  }

  async upsertLocation(
    userId: string,
    date: Date,
    data: { locationName?: string | null; latitude?: number | null; longitude?: number | null },
  ) {
    const update: Record<string, unknown> = {};
    if (data.locationName !== undefined) update.locationName = data.locationName;
    if (data.latitude !== undefined) update.latitude = data.latitude;
    if (data.longitude !== undefined) update.longitude = data.longitude;

    return this.prisma.day.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...update },
      update,
      include: this.dayInclude,
    });
  }

  async findByUserIdAndDateRange(userId: string, from: Date, to: Date) {
    return this.prisma.day.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      include: this.dayInclude,
      orderBy: { date: 'asc' },
    });
  }
}
