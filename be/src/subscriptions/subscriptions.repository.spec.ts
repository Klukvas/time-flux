import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('SubscriptionsRepository', () => {
  let repository: SubscriptionsRepository;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      subscription: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(SubscriptionsRepository);
  });

  describe('findByUserId', () => {
    it('should query subscription by userId', async () => {
      const expected = { id: 'sub-1', userId: 'user-1', tier: 'FREE' };
      prisma.subscription.findUnique.mockResolvedValue(expected);

      const result = await repository.findByUserId('user-1');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual(expected);
    });

    it('should return null when no subscription found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('no-user');

      expect(result).toBeNull();
    });
  });

  describe('createFree', () => {
    it('should create a FREE/ACTIVE subscription', async () => {
      const expected = { id: 'sub-1', userId: 'user-1', tier: 'FREE', status: 'ACTIVE' };
      prisma.subscription.create.mockResolvedValue(expected);

      const result = await repository.createFree('user-1');

      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', tier: 'FREE', status: 'ACTIVE' },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('upsertFree', () => {
    it('should upsert subscription with FREE defaults', async () => {
      const expected = { id: 'sub-1', userId: 'user-1', tier: 'FREE', status: 'ACTIVE' };
      prisma.subscription.upsert.mockResolvedValue(expected);

      const result = await repository.upsertFree('user-1');

      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', tier: 'FREE', status: 'ACTIVE' },
        update: {},
      });
      expect(result).toEqual(expected);
    });
  });

  describe('updateByUserId', () => {
    it('should update subscription by userId', async () => {
      const data = { tier: 'PRO' as const, status: 'ACTIVE' as const };
      const expected = { id: 'sub-1', userId: 'user-1', ...data };
      prisma.subscription.update.mockResolvedValue(expected);

      const result = await repository.updateByUserId('user-1', data);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data,
      });
      expect(result).toEqual(expected);
    });

    it('should handle partial updates with nullable fields', async () => {
      const data = { canceledAt: new Date('2026-05-01') };
      prisma.subscription.update.mockResolvedValue({ id: 'sub-1', ...data });

      await repository.updateByUserId('user-1', data);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data,
      });
    });
  });

  describe('updateByPaddleSubscriptionId', () => {
    it('should update subscription by paddleSubscriptionId', async () => {
      const data = { tier: 'PREMIUM' as const, status: 'ACTIVE' as const };
      prisma.subscription.update.mockResolvedValue({ id: 'sub-1', ...data });

      const result = await repository.updateByPaddleSubscriptionId('sub_abc', data);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { paddleSubscriptionId: 'sub_abc' },
        data,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findByPaddleCustomerId', () => {
    it('should query subscription by paddleCustomerId', async () => {
      const expected = { id: 'sub-1', paddleCustomerId: 'ctm_xyz' };
      prisma.subscription.findUnique.mockResolvedValue(expected);

      const result = await repository.findByPaddleCustomerId('ctm_xyz');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { paddleCustomerId: 'ctm_xyz' },
      });
      expect(result).toEqual(expected);
    });

    it('should return null when no subscription found by paddleCustomerId', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      const result = await repository.findByPaddleCustomerId('ctm_none');

      expect(result).toBeNull();
    });
  });
});
