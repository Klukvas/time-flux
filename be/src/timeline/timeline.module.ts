import { Module } from '@nestjs/common';
import { TimelineController } from './timeline.controller.js';
import { TimelineService } from './timeline.service.js';
import { EventGroupsModule } from '../event-groups/event-groups.module.js';
import { DaysModule } from '../days/days.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  imports: [EventGroupsModule, DaysModule, AuthModule, S3Module],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
