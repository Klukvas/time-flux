import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('should return ok status when database is connected', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result).toEqual({ status: 'ok', database: 'connected' });
  });

  it('should throw 503 when database query fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    await expect(controller.check()).rejects.toThrow(HttpException);

    try {
      await controller.check();
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect((err as HttpException).getResponse()).toEqual({
        status: 'degraded',
        database: 'disconnected',
      });
    }
  });
});
