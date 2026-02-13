import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.category.findFirst({
      where: { id, userId },
    });
  }

  async create(data: { userId: string; name: string; color: string; order?: number; isSystem?: boolean }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string; color?: string; order?: number }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async countByUserId(userId: string) {
    return this.prisma.category.count({ where: { userId } });
  }

  async countEventGroupsForCategory(categoryId: string): Promise<number> {
    return this.prisma.eventGroup.count({ where: { categoryId } });
  }
}
