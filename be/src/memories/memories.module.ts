import { Module } from '@nestjs/common';
import { MemoriesController } from './memories.controller.js';
import { MemoriesService } from './memories.service.js';
import { MemoriesRepository } from './memories.repository.js';
import { AuthModule } from '../auth/auth.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [MemoriesController],
  providers: [MemoriesService, MemoriesRepository],
})
export class MemoriesModule {}
