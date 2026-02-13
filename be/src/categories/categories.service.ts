import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import { CategoryNotFoundError, CategoryInUseError, RecommendationNotFoundError } from '../common/errors/app.error.js';
import { CATEGORY_RECOMMENDATIONS } from '../common/constants/recommendations.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(userId: string) {
    return this.categoriesRepository.findAllByUserId(userId);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const count = await this.categoriesRepository.countByUserId(userId);
    return this.categoriesRepository.create({
      userId,
      name: dto.name,
      color: dto.color,
      order: dto.order ?? count,
    });
  }

  async createFromRecommendation(userId: string, dto: CreateFromRecommendationDto) {
    const recommendation = CATEGORY_RECOMMENDATIONS.find((r) => r.key === dto.key);
    if (!recommendation) {
      throw new RecommendationNotFoundError({ key: dto.key });
    }

    const count = await this.categoriesRepository.countByUserId(userId);
    return this.categoriesRepository.create({
      userId,
      name: dto.name,
      color: recommendation.color,
      order: count,
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findByIdAndUserId(id, userId);
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
    const category = await this.categoriesRepository.findByIdAndUserId(id, userId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const groupCount = await this.categoriesRepository.countEventGroupsForCategory(id);
    if (groupCount > 0) {
      throw new CategoryInUseError({ categoryId: id, groupCount });
    }

    await this.categoriesRepository.delete(id);
  }
}
