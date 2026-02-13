import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    dayId: string;
    userId: string;
    s3Key: string;
    fileName: string;
    contentType: string;
    size: number;
  }) {
    return this.prisma.dayMedia.create({ data });
  }

  async findByDayAndUser(dayId: string, userId: string) {
    return this.prisma.dayMedia.findMany({
      where: { dayId, userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.prisma.dayMedia.findFirst({
      where: { id, userId },
    });
  }

  async deleteById(id: string) {
    return this.prisma.dayMedia.delete({ where: { id } });
  }

  async findByDayId(dayId: string) {
    return this.prisma.dayMedia.findMany({
      where: { dayId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findDayByDateAndUser(date: Date, userId: string) {
    return this.prisma.day.findUnique({
      where: { userId_date: { userId, date } },
    });
  }

  async upsertDay(userId: string, date: Date) {
    return this.prisma.day.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date },
      update: {},
      select: { id: true, userId: true, date: true, dayStateId: true, mainMediaId: true },
    });
  }

  async setMainMedia(dayId: string, mediaId: string) {
    return this.prisma.day.update({
      where: { id: dayId },
      data: { mainMediaId: mediaId },
    });
  }

  async clearMainMediaIfMatch(dayId: string, mediaId: string) {
    return this.prisma.day.updateMany({
      where: { id: dayId, mainMediaId: mediaId },
      data: { mainMediaId: null },
    });
  }
}
