import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { PaddleService } from './paddle.service.js';
import { WebhookService } from './webhook.service.js';
import { WebhookRepository } from './webhook.repository.js';
import { WebhookController } from './webhook.controller.js';
@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController, WebhookController],
  providers: [
    SubscriptionsService,
    SubscriptionsRepository,
    PaddleService,
    WebhookService,
    WebhookRepository,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
