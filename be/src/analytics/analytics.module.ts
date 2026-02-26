import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsRepository } from './analytics.repository.js';
import { AuthModule } from '../auth/auth.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
