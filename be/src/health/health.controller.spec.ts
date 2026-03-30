import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from '../s3/s3.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: Record<string, jest.Mock>;
  let s3Service: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    s3Service = {
      checkConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('live', () => {
    it('should return ok status', () => {
      const result = controller.live();

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('ready', () => {
    it('should return ok when all components are connected', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      s3Service.checkConnection.mockResolvedValue(undefined);

      const result = await controller.ready();

      expect(result).toEqual({
        status: 'ok',
        components: {
          database: 'connected',
          s3: 'connected',
        },
      });
    });

    it('should throw 503 when database is disconnected', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      s3Service.checkConnection.mockResolvedValue(undefined);

      await expect(controller.ready()).rejects.toThrow(HttpException);

      try {
        await controller.ready();
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        expect((err as HttpException).getResponse()).toEqual({
          status: 'degraded',
          components: {
            database: 'disconnected',
            s3: 'connected',
          },
        });
      }
    });

    it('should throw 503 when S3 is disconnected', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      s3Service.checkConnection.mockRejectedValue(new Error('S3 unreachable'));

      await expect(controller.ready()).rejects.toThrow(HttpException);

      try {
        await controller.ready();
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        expect((err as HttpException).getResponse()).toEqual({
          status: 'degraded',
          components: {
            database: 'connected',
            s3: 'disconnected',
          },
        });
      }
    });

    it('should throw 503 when both components are disconnected', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      s3Service.checkConnection.mockRejectedValue(new Error('S3 unreachable'));

      await expect(controller.ready()).rejects.toThrow(HttpException);

      try {
        await controller.ready();
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        expect((err as HttpException).getResponse()).toEqual({
          status: 'degraded',
          components: {
            database: 'disconnected',
            s3: 'disconnected',
          },
        });
      }
    });
  });

  describe('check (backward compatibility)', () => {
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
});
