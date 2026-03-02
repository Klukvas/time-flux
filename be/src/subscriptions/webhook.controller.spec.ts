import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';
import { UnauthorizedError } from '../common/errors/app.error.js';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: { handleEvent: jest.Mock };

  const WEBHOOK_SECRET = 'test-webhook-secret';

  function makeSignature(
    body: string,
    ts = String(Math.floor(Date.now() / 1000)),
  ) {
    const signedPayload = `${ts}:${body}`;
    const h1 = createHmac('sha256', WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');
    return `ts=${ts};h1=${h1}`;
  }

  beforeEach(async () => {
    webhookService = {
      handleEvent: jest.fn().mockResolvedValue(undefined),
    };

    const config = {
      get: (key: string) =>
        key === 'PADDLE_WEBHOOK_SECRET' ? WEBHOOK_SECRET : undefined,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: WebhookService, useValue: webhookService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    controller = module.get(WebhookController);
  });

  it('should return { received: true } with valid signature', async () => {
    const body = JSON.stringify({
      event_id: 'evt_1',
      event_type: 'subscription.created',
      data: {},
    });
    const rawBody = Buffer.from(body);
    const signature = makeSignature(body);

    const result = await controller.handlePaddleWebhook(signature, rawBody);

    expect(result).toEqual({ received: true });
    // handleEvent is called async, give it a tick
    await new Promise((r) => setImmediate(r));
    expect(webhookService.handleEvent).toHaveBeenCalledWith(JSON.parse(body));
  });

  it('should throw UnauthorizedError when signature header is missing', async () => {
    const rawBody = Buffer.from('{}');

    await expect(
      controller.handlePaddleWebhook(undefined, rawBody),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when signature is invalid', async () => {
    const body = JSON.stringify({ event_id: 'evt_1' });
    const rawBody = Buffer.from(body);
    const invalidSig =
      'ts=123;h1=0000000000000000000000000000000000000000000000000000000000000000';

    await expect(
      controller.handlePaddleWebhook(invalidSig, rawBody),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when signature format is wrong', async () => {
    const rawBody = Buffer.from('{}');

    await expect(
      controller.handlePaddleWebhook('bad-format', rawBody),
    ).rejects.toThrow(UnauthorizedError);
  });
});
