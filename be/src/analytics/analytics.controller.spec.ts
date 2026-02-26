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
  let subscriptionsService: { assertFeatureAccess: jest.Mock };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      getMoodOverview: jest.fn(),
    };

    subscriptionsService = {
      assertFeatureAccess: jest.fn(),
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
    it('should delegate to analyticsService.getMoodOverview with user.sub', async () => {
      const expected = {
        distribution: [],
        categoryStats: [],
        thirtyDayTrend: [],
        weekdayInsights: [],
      };
      service.getMoodOverview.mockResolvedValue(expected);

      const result = await controller.getMoodOverview(mockUser);

      expect(service.getMoodOverview).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const serviceResult = { distribution: [{ score: 9, count: 5 }] };
      service.getMoodOverview.mockResolvedValue(serviceResult);

      const result = await controller.getMoodOverview(mockUser);

      expect(result).toBe(serviceResult);
    });

    it('should only pass user.sub, not the full user object', async () => {
      service.getMoodOverview.mockResolvedValue({});

      await controller.getMoodOverview(mockUser);

      expect(service.getMoodOverview).toHaveBeenCalledWith('user-1');
      expect(service.getMoodOverview).not.toHaveBeenCalledWith(mockUser);
    });

    it('should propagate service errors', async () => {
      service.getMoodOverview.mockRejectedValue(new Error('Analytics failed'));

      await expect(controller.getMoodOverview(mockUser)).rejects.toThrow(
        'Analytics failed',
      );
    });

    it('should check feature access before calling service', async () => {
      service.getMoodOverview.mockResolvedValue({});

      await controller.getMoodOverview(mockUser);

      expect(subscriptionsService.assertFeatureAccess).toHaveBeenCalledWith(
        'user-1',
        'analytics',
      );
    });

    it('should throw FeatureLockedError for FREE users', async () => {
      subscriptionsService.assertFeatureAccess.mockRejectedValue(
        new FeatureLockedError({ feature: 'analytics', tier: 'FREE' }),
      );

      await expect(controller.getMoodOverview(mockUser)).rejects.toThrow(
        FeatureLockedError,
      );
      expect(service.getMoodOverview).not.toHaveBeenCalled();
    });
  });
});
