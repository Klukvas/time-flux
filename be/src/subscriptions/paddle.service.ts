import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { PaddleNotConfiguredError } from '../common/errors/app.error.js';

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly client: Paddle | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('PADDLE_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'PADDLE_API_KEY not set — Paddle integration disabled',
      );
      this.client = null;
      return;
    }

    const env =
      this.config.get<string>('PADDLE_ENVIRONMENT') === 'production'
        ? Environment.production
        : Environment.sandbox;

    this.client = new Paddle(apiKey, { environment: env });
    this.logger.log(`Paddle client initialized (${env})`);
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async cancelSubscription(
    subscriptionId: string,
    effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period',
  ) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.cancel(subscriptionId, { effectiveFrom });
  }

  async getSubscription(subscriptionId: string) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.get(subscriptionId);
  }
}
