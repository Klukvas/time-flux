import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ValidationError } from '../common/errors/app.error.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateBirthDate(userId: string, birthDate: Date | null) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { birthDate },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ValidationError({ userId: 'User not found' });
      }
      throw error;
    }
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
