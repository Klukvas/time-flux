import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaddleService } from './paddle.service.js';
import { PaddleNotConfiguredError } from '../common/errors/app.error.js';

describe('PaddleService', () => {
  const makeConfig = (env: Record<string, string | undefined>) =>
    ({ get: (key: string) => env[key] }) as unknown as ConfigService;

  describe('when PADDLE_API_KEY is not set', () => {
    let service: PaddleService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaddleService,
          { provide: ConfigService, useValue: makeConfig({}) },
        ],
      }).compile();

      service = module.get(PaddleService);
    });

    it('should have isEnabled = false', () => {
      expect(service.isEnabled).toBe(false);
    });

    it('should throw PaddleNotConfiguredError on cancelSubscription', async () => {
      await expect(service.cancelSubscription('sub_123')).rejects.toThrow(
        PaddleNotConfiguredError,
      );
    });

    it('should throw PaddleNotConfiguredError on getSubscription', async () => {
      await expect(service.getSubscription('sub_123')).rejects.toThrow(
        PaddleNotConfiguredError,
      );
    });

    it('should throw PaddleNotConfiguredError on getPrice', async () => {
      await expect(service.getPrice('pri_123')).rejects.toThrow(
        PaddleNotConfiguredError,
      );
    });

    it('should throw PaddleNotConfiguredError on clearScheduledChange', async () => {
      await expect(service.clearScheduledChange('sub_123')).rejects.toThrow(
        PaddleNotConfiguredError,
      );
    });

    it('should throw PaddleNotConfiguredError on updateSubscription', async () => {
      await expect(
        service.updateSubscription('sub_123', 'pri_456'),
      ).rejects.toThrow(PaddleNotConfiguredError);
    });
  });

  describe('when PADDLE_API_KEY is set', () => {
    let service: PaddleService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaddleService,
          {
            provide: ConfigService,
            useValue: makeConfig({
              PADDLE_API_KEY: 'test_api_key',
              PADDLE_ENVIRONMENT: 'sandbox',
            }),
          },
        ],
      }).compile();

      service = module.get(PaddleService);
    });

    it('should have isEnabled = true', () => {
      expect(service.isEnabled).toBe(true);
    });
  });
});
