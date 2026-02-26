import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesRepository],
})
export class CategoriesModule {}
