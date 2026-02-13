import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MemoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Check if a single day has content (dayState or media). Returns the day or null. */
  async findDayWithContent(userId: string, date: Date) {
    return this.prisma.day.findFirst({
      where: {
        userId,
        date,
        OR: [{ dayStateId: { not: null } }, { media: { some: {} } }],
      },
      select: { id: true },
    });
  }

  /** Fetch days by exact dates, including dayState and media. */
  async findDaysByDates(userId: string, dates: Date[]) {
    if (dates.length === 0) return [];
    return this.prisma.day.findMany({
      where: { userId, date: { in: dates } },
      include: {
        dayState: { select: { id: true, name: true, color: true } },
        media: { select: { id: true } },
      },
    });
  }

  /** Check if any day in a date range has content. */
  async hasContentInRange(userId: string, start: Date, end: Date) {
    const day = await this.prisma.day.findFirst({
      where: {
        userId,
        date: { gte: start, lte: end },
        OR: [{ dayStateId: { not: null } }, { media: { some: {} } }],
      },
      select: { id: true },
    });
    return !!day;
  }

  /** Fetch all days in a date range with dayState and media. */
  async findDaysInRange(userId: string, start: Date, end: Date) {
    return this.prisma.day.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        dayState: { select: { id: true, name: true, color: true } },
        media: { select: { id: true } },
      },
    });
  }
}
