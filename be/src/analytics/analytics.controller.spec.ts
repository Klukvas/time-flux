import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { FeatureLockedError } from '../common/errors/app.error.js';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: {
    getMoodOverview: jest.Mock;
  };
  let subscriptionsService: {
    getAnalyticsAccessLevel: jest.Mock;
    getTier: jest.Mock;
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
  };

  beforeEach(async () => {
    service = {
      getMoodOverview: jest.fn(),
    };

    subscriptionsService = {
      getAnalyticsAccessLevel: jest.fn().mockResolvedValue(true),
      getTier: jest.fn().mockResolvedValue('PRO'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: service },
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  describe('getMoodOverview', () => {
    it('should call getMoodOverview with fullAccess=true for PRO', async () => {
      const expected = { distribution: [], categoryStats: [] };
      service.getMoodOverview.mockResolvedValue(expected);

      const result = await controller.getMoodOverview(mockUser);

      expect(subscriptionsService.getAnalyticsAccessLevel).toHaveBeenCalledWith('user-1');
      expect(service.getMoodOverview).toHaveBeenCalledWith('user-1', 'UTC', true);
      expect(result).toEqual(expected);
    });

    it('should call getMoodOverview with fullAccess=false for basic access', async () => {
      subscriptionsService.getAnalyticsAccessLevel.mockResolvedValue('basic');
      service.getMoodOverview.mockResolvedValue({ distribution: [] });

      await controller.getMoodOverview(mockUser);

      expect(service.getMoodOverview).toHaveBeenCalledWith('user-1', 'UTC', false);
    });

    it('should pass through the service result unchanged', async () => {
      const serviceResult = { distribution: [{ score: 9, count: 5 }] };
      service.getMoodOverview.mockResolvedValue(serviceResult);

      const result = await controller.getMoodOverview(mockUser);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      service.getMoodOverview.mockRejectedValue(new Error('Analytics failed'));

      await expect(controller.getMoodOverview(mockUser)).rejects.toThrow(
        'Analytics failed',
      );
    });

    it('should throw FeatureLockedError when access is false', async () => {
      subscriptionsService.getAnalyticsAccessLevel.mockResolvedValue(false);
      subscriptionsService.getTier.mockResolvedValue('FREE');

      await expect(controller.getMoodOverview(mockUser)).rejects.toThrow(
        FeatureLockedError,
      );
      expect(service.getMoodOverview).not.toHaveBeenCalled();
    });
  });
});
