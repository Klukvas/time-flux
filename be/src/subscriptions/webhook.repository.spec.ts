import { Test, TestingModule } from '@nestjs/testing';
import { WebhookRepository } from './webhook.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('WebhookRepository', () => {
  let repo: WebhookRepository;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      webhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(WebhookRepository);
  });

  it('should find event by id', async () => {
    const event = { id: 'evt_1', type: 'subscription.created', processed: false };
    prisma.webhookEvent.findUnique.mockResolvedValue(event);

    const result = await repo.findById('evt_1');

    expect(prisma.webhookEvent.findUnique).toHaveBeenCalledWith({
      where: { id: 'evt_1' },
    });
    expect(result).toEqual(event);
  });

  it('should create a webhook event', async () => {
    const payload = { event_type: 'subscription.created' };
    prisma.webhookEvent.create.mockResolvedValue({
      id: 'evt_1',
      type: 'subscription.created',
      processed: false,
      payload,
    });

    await repo.create('evt_1', 'subscription.created', payload);

    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: { id: 'evt_1', type: 'subscription.created', payload },
    });
  });

  it('should mark event as processed', async () => {
    prisma.webhookEvent.update.mockResolvedValue({ id: 'evt_1', processed: true });

    await repo.markProcessed('evt_1');

    expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt_1' },
      data: { processed: true },
    });
  });
});
