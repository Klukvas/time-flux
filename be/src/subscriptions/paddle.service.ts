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
      this.logger.warn('PADDLE_API_KEY not set — Paddle integration disabled');
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
    effectiveFrom:
      | 'next_billing_period'
      | 'immediately' = 'next_billing_period',
  ) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.cancel(subscriptionId, { effectiveFrom });
  }

  async getPrice(priceId: string) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.prices.get(priceId);
  }

  async getSubscription(subscriptionId: string) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.get(subscriptionId);
  }

  async clearScheduledChange(subscriptionId: string) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.update(subscriptionId, {
      scheduledChange: null,
    });
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBillingMode:
      | 'prorated_immediately'
      | 'prorated_next_billing_period' = 'prorated_immediately',
  ) {
    if (!this.client) throw new PaddleNotConfiguredError();
    return this.client.subscriptions.update(subscriptionId, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode,
    });
  }
}
