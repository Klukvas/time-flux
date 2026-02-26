import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.webhookEvent.findUnique({ where: { id } });
  }

  async create(id: string, type: string, payload: unknown) {
    return this.prisma.webhookEvent.create({
      data: { id, type, payload: payload as object },
    });
  }

  async markProcessed(id: string) {
    return this.prisma.webhookEvent.update({
      where: { id },
      data: { processed: true },
    });
  }
}
