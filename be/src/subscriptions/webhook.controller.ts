import {
  Controller,
  Post,
  Headers,
  RawBody,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookService } from './webhook.service.js';
import { UnauthorizedError } from '../common/errors/app.error.js';

@ApiExcludeController()
@SkipThrottle()
@Controller('api/v1/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly webhookService: WebhookService,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('PADDLE_WEBHOOK_SECRET');
  }

  @Post('paddle')
  @HttpCode(200)
  async handlePaddleWebhook(
    @Headers('paddle-signature') signature: string | undefined,
    @RawBody() rawBody: Buffer,
  ) {
    this.verifySignature(signature, rawBody);

    const payload = JSON.parse(rawBody.toString());

    await this.webhookService.handleEvent(payload);

    return { received: true };
  }

  private verifySignature(
    signature: string | undefined,
    rawBody: Buffer,
  ): void {
    if (!this.webhookSecret) {
      throw new UnauthorizedError('Webhook secret not configured');
    }

    if (!signature) {
      throw new UnauthorizedError('Missing paddle-signature header');
    }

    // Parse "ts=...;h1=..." format
    const parts = Object.fromEntries(
      signature.split(';').map((p) => {
        const [key, ...rest] = p.split('=');
        return [key, rest.join('=')];
      }),
    );

    const ts = parts['ts'];
    const h1 = parts['h1'];
    if (!ts || !h1) {
      throw new UnauthorizedError('Invalid paddle-signature format');
    }

    // Reject stale timestamps (replay protection: 5-minute window)
    const timestampAge = Math.abs(Date.now() / 1000 - Number(ts));
    if (Number.isNaN(timestampAge) || timestampAge > 300) {
      throw new UnauthorizedError('Webhook timestamp too old or invalid');
    }

    const signedPayload = `${ts}:${rawBody.toString()}`;
    const expectedSig = createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    const sigBuffer = Buffer.from(h1, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedError('Invalid webhook signature');
    }
  }
}
