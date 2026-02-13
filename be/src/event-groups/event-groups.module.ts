import { Module } from '@nestjs/common';
import { EventGroupsController } from './event-groups.controller.js';
import { EventPeriodsController } from './event-periods.controller.js';
import { EventGroupsService } from './event-groups.service.js';
import { EventGroupsRepository } from './event-groups.repository.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DaysModule } from '../days/days.module.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  imports: [CategoriesModule, AuthModule, DaysModule, S3Module],
  controllers: [EventGroupsController, EventPeriodsController],
  providers: [EventGroupsService, EventGroupsRepository],
  exports: [EventGroupsRepository],
})
export class EventGroupsModule {}
