import { Test, TestingModule } from '@nestjs/testing';
import { MemoriesController } from './memories.controller.js';
import { MemoriesService } from './memories.service.js';
import { OnThisDayQueryDto } from './dto/on-this-day-query.dto.js';
import { ContextQueryDto } from './dto/context-query.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { FeatureLockedError } from '../common/errors/app.error.js';

describe('MemoriesController', () => {
  let controller: MemoriesController;
  let service: {
    getOnThisDay: jest.Mock;
    getContext: jest.Mock;
  };
  let subscriptionsService: { assertFeatureAccess: jest.Mock };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      getOnThisDay: jest.fn(),
      getContext: jest.fn(),
    };

    subscriptionsService = {
      assertFeatureAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemoriesController],
      providers: [
        { provide: MemoriesService, useValue: service },
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    }).compile();

    controller = module.get<MemoriesController>(MemoriesController);
  });

  describe('getOnThisDay', () => {
    it('should delegate to memoriesService.getOnThisDay with user.sub and query.date', async () => {
      const query: OnThisDayQueryDto = {
        date: '2024-01-15',
      } as OnThisDayQueryDto;
      const expected = { oneMonthAgo: [], sixMonthsAgo: [], oneYearAgo: [] };
      service.getOnThisDay.mockResolvedValue(expected);

      const result = await controller.getOnThisDay(mockUser, query);

      expect(service.getOnThisDay).toHaveBeenCalledWith('user-1', '2024-01-15');
      expect(result).toEqual(expected);
    });

    it('should pass query.date (not the whole query object) to service', async () => {
      const query: OnThisDayQueryDto = {
        date: '2024-06-15',
      } as OnThisDayQueryDto;
      service.getOnThisDay.mockResolvedValue({});

      await controller.getOnThisDay(mockUser, query);

      expect(service.getOnThisDay).toHaveBeenCalledWith('user-1', '2024-06-15');
      expect(service.getOnThisDay).not.toHaveBeenCalledWith('user-1', query);
    });

    it('should handle undefined date in query', async () => {
      const query: OnThisDayQueryDto = {} as OnThisDayQueryDto;
      const expected = { oneMonthAgo: [], sixMonthsAgo: [], oneYearAgo: [] };
      service.getOnThisDay.mockResolvedValue(expected);

      const result = await controller.getOnThisDay(mockUser, query);

      expect(service.getOnThisDay).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      const query = {} as OnThisDayQueryDto;
      service.getOnThisDay.mockRejectedValue(new Error('Service error'));

      await expect(controller.getOnThisDay(mockUser, query)).rejects.toThrow(
        'Service error',
      );
    });

    it('should throw FeatureLockedError for FREE/PRO users', async () => {
      const query: OnThisDayQueryDto = {
        date: '2024-01-15',
      } as OnThisDayQueryDto;
      subscriptionsService.assertFeatureAccess.mockRejectedValue(
        new FeatureLockedError({ feature: 'memories', tier: 'FREE' }),
      );

      await expect(controller.getOnThisDay(mockUser, query)).rejects.toThrow(
        FeatureLockedError,
      );
      expect(service.getOnThisDay).not.toHaveBeenCalled();
    });
  });

  describe('getContext', () => {
    it('should delegate to memoriesService.getContext with user.sub, query.mode and query.date', async () => {
      const query: ContextQueryDto = {
        mode: 'day',
        date: '2024-01-15',
      } as ContextQueryDto;
      const expected = {
        oneMonthAgo: null,
        sixMonthsAgo: null,
        oneYearAgo: null,
      };
      service.getContext.mockResolvedValue(expected);

      const result = await controller.getContext(mockUser, query);

      expect(service.getContext).toHaveBeenCalledWith(
        'user-1',
        'day',
        '2024-01-15',
      );
      expect(result).toEqual(expected);
    });

    it('should pass query.mode and query.date (not the whole query) to service', async () => {
      const query: ContextQueryDto = {
        mode: 'week',
        date: '2024-03-10',
      } as ContextQueryDto;
      service.getContext.mockResolvedValue({});

      await controller.getContext(mockUser, query);

      expect(service.getContext).toHaveBeenCalledWith(
        'user-1',
        'week',
        '2024-03-10',
      );
      expect(service.getContext).not.toHaveBeenCalledWith('user-1', query);
    });

    it('should pass through the service result unchanged', async () => {
      const query = { mode: 'day', date: '2024-01-15' } as ContextQueryDto;
      const serviceResult = { oneMonthAgo: { id: 'day-1' } };
      service.getContext.mockResolvedValue(serviceResult);

      const result = await controller.getContext(mockUser, query);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const query = { mode: 'day', date: '2024-01-15' } as ContextQueryDto;
      service.getContext.mockRejectedValue(new Error('Context fetch failed'));

      await expect(controller.getContext(mockUser, query)).rejects.toThrow(
        'Context fetch failed',
      );
    });

    it('should throw FeatureLockedError for FREE/PRO users', async () => {
      const query = { mode: 'day', date: '2024-01-15' } as ContextQueryDto;
      subscriptionsService.assertFeatureAccess.mockRejectedValue(
        new FeatureLockedError({ feature: 'memories', tier: 'PRO' }),
      );

      await expect(controller.getContext(mockUser, query)).rejects.toThrow(
        FeatureLockedError,
      );
      expect(service.getContext).not.toHaveBeenCalled();
    });
  });
});
