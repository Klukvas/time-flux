import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DayStatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string) {
    return this.prisma.dayState.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.dayState.findFirst({
      where: { id, userId },
    });
  }

  async create(data: { userId: string; name: string; color: string; order?: number; score: number; isSystem?: boolean }) {
    return this.prisma.dayState.create({ data });
  }

  async update(id: string, data: { name?: string; color?: string; order?: number; score?: number }) {
    return this.prisma.dayState.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.dayState.delete({ where: { id } });
  }

  async countByUserId(userId: string) {
    return this.prisma.dayState.count({ where: { userId } });
  }

  async countDaysForDayState(dayStateId: string): Promise<number> {
    return this.prisma.day.count({ where: { dayStateId } });
  }
}
