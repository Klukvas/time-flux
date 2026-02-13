import { Module } from '@nestjs/common';
import { DaysController } from './days.controller.js';
import { DaysService } from './days.service.js';
import { DaysRepository } from './days.repository.js';
import { DayStatesModule } from '../day-states/day-states.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  imports: [DayStatesModule, AuthModule, S3Module],
  controllers: [DaysController],
  providers: [DaysService, DaysRepository],
  exports: [DaysRepository],
})
export class DaysModule {}
