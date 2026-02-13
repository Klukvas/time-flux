import { Injectable } from '@nestjs/common';
import { DayStatesRepository } from './day-states.repository.js';
import { CreateDayStateDto } from './dto/create-day-state.dto.js';
import { UpdateDayStateDto } from './dto/update-day-state.dto.js';
import { CreateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import { DayStateNotFoundError, DayStateInUseError, RecommendationNotFoundError } from '../common/errors/app.error.js';
import { MOOD_RECOMMENDATIONS } from '../common/constants/recommendations.js';

@Injectable()
export class DayStatesService {
  constructor(private readonly dayStatesRepository: DayStatesRepository) {}

  async findAll(userId: string) {
    return this.dayStatesRepository.findAllByUserId(userId);
  }

  async create(userId: string, dto: CreateDayStateDto) {
    const count = await this.dayStatesRepository.countByUserId(userId);
    return this.dayStatesRepository.create({
      userId,
      name: dto.name,
      color: dto.color,
      order: dto.order ?? count,
      score: dto.score,
    });
  }

  async createFromRecommendation(userId: string, dto: CreateFromRecommendationDto) {
    const recommendation = MOOD_RECOMMENDATIONS.find((r) => r.key === dto.key);
    if (!recommendation) {
      throw new RecommendationNotFoundError({ key: dto.key });
    }

    const count = await this.dayStatesRepository.countByUserId(userId);
    return this.dayStatesRepository.create({
      userId,
      name: dto.name,
      color: recommendation.color,
      order: count,
      score: recommendation.score,
    });
  }

  async update(userId: string, id: string, dto: UpdateDayStateDto) {
    const dayState = await this.dayStatesRepository.findByIdAndUserId(id, userId);
    if (!dayState) {
      throw new DayStateNotFoundError();
    }

    return this.dayStatesRepository.update(id, {
      name: dto.name,
      color: dto.color,
      order: dto.order,
      score: dto.score,
    });
  }

  async delete(userId: string, id: string) {
    const dayState = await this.dayStatesRepository.findByIdAndUserId(id, userId);
    if (!dayState) {
      throw new DayStateNotFoundError();
    }

    const dayCount = await this.dayStatesRepository.countDaysForDayState(id);
    if (dayCount > 0) {
      throw new DayStateInUseError({ dayStateId: id, dayCount });
    }

    await this.dayStatesRepository.delete(id);
  }
}
