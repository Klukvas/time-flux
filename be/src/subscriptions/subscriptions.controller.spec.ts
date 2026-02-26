import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: Record<string, jest.Mock>;

  const user = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      getSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        { provide: SubscriptionsService, useValue: service },
      ],
    }).compile();

    controller = module.get(SubscriptionsController);
  });

  it('should return subscription with limits', async () => {
    const mockSub = {
      id: 'sub-1',
      tier: 'FREE',
      status: 'ACTIVE',
      limits: { media: 50, chapters: 5, categories: 5, dayStates: 5, analytics: false, memories: false },
    };
    service.getSubscription.mockResolvedValue(mockSub);

    const result = await controller.getSubscription(user);

    expect(service.getSubscription).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockSub);
  });

  it('should delegate cancel to service', async () => {
    const cancelResult = {
      message: 'Subscription will be canceled at the end of the billing period',
      canceledAt: '2026-03-01T00:00:00.000Z',
    };
    service.cancelSubscription.mockResolvedValue(cancelResult);

    const result = await controller.cancelSubscription(user);

    expect(service.cancelSubscription).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(cancelResult);
  });
});
