import { Module } from '@nestjs/common';
import { DayStatesController } from './day-states.controller.js';
import { DayStatesService } from './day-states.service.js';
import { DayStatesRepository } from './day-states.repository.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [DayStatesController],
  providers: [DayStatesService, DayStatesRepository],
  exports: [DayStatesRepository],
})
export class DayStatesModule {}
