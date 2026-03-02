import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateCategoryFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import {
  CategoryNotFoundError,
  CategoryInUseError,
  RecommendationNotFoundError,
} from '../common/errors/app.error.js';
import { CATEGORY_RECOMMENDATIONS } from '../common/constants/recommendations.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: string) {
    return this.categoriesRepository.findAllByUserId(userId);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const count = await tx.category.count({ where: { userId } });
        await this.subscriptionsService.assertResourceLimit(
          userId,
          'categories',
          count,
        );
        return tx.category.create({
          data: {
            userId,
            name: dto.name,
            color: dto.color,
            order: dto.order ?? count,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async createFromRecommendation(
    userId: string,
    dto: CreateCategoryFromRecommendationDto,
  ) {
    const recommendation = CATEGORY_RECOMMENDATIONS.find(
      (r) => r.key === dto.key,
    );
    if (!recommendation) {
      throw new RecommendationNotFoundError({ key: dto.key });
    }

    return this.prisma.$transaction(
      async (tx) => {
        const count = await tx.category.count({ where: { userId } });
        await this.subscriptionsService.assertResourceLimit(
          userId,
          'categories',
          count,
        );
        return tx.category.create({
          data: {
            userId,
            name: dto.name,
            color: recommendation.color,
            order: count,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!category) {
      throw new CategoryNotFoundError();
    }

    return this.categoriesRepository.update(id, {
      name: dto.name,
      color: dto.color,
      order: dto.order,
    });
  }

  async delete(userId: string, id: string) {
    const category = await this.categoriesRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!category) {
      throw new CategoryNotFoundError();
    }

    // Serializable tx prevents race: another request creating a group with
    // this category between our count-check and delete would cause a
    // serialization failure, retried by the client.
    await this.prisma.$transaction(
      async (tx) => {
        const groupCount = await tx.eventGroup.count({
          where: { categoryId: id },
        });
        if (groupCount > 0) {
          throw new CategoryInUseError({ categoryId: id, groupCount });
        }
        await tx.category.delete({ where: { id, userId } });
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
