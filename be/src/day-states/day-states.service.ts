import { Injectable } from '@nestjs/common';
import { DayStatesRepository } from './day-states.repository.js';
import { CreateDayStateDto } from './dto/create-day-state.dto.js';
import { UpdateDayStateDto } from './dto/update-day-state.dto.js';
import { CreateDayStateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import {
  DayStateNotFoundError,
  DayStateInUseError,
  RecommendationNotFoundError,
} from '../common/errors/app.error.js';
import { MOOD_RECOMMENDATIONS } from '../common/constants/recommendations.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DayStatesService {
  constructor(
    private readonly dayStatesRepository: DayStatesRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: string) {
    return this.dayStatesRepository.findAllByUserId(userId);
  }

  async create(userId: string, dto: CreateDayStateDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const count = await tx.dayState.count({ where: { userId } });
        await this.subscriptionsService.assertResourceLimit(
          userId,
          'dayStates',
          count,
        );
        return tx.dayState.create({
          data: {
            userId,
            name: dto.name,
            color: dto.color,
            order: dto.order ?? count,
            score: dto.score,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async createFromRecommendation(
    userId: string,
    dto: CreateDayStateFromRecommendationDto,
  ) {
    const recommendation = MOOD_RECOMMENDATIONS.find((r) => r.key === dto.key);
    if (!recommendation) {
      throw new RecommendationNotFoundError({ key: dto.key });
    }

    return this.prisma.$transaction(
      async (tx) => {
        const count = await tx.dayState.count({ where: { userId } });
        await this.subscriptionsService.assertResourceLimit(
          userId,
          'dayStates',
          count,
        );
        return tx.dayState.create({
          data: {
            userId,
            name: dto.name,
            color: recommendation.color,
            order: count,
            score: recommendation.score,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async update(userId: string, id: string, dto: UpdateDayStateDto) {
    const dayState = await this.dayStatesRepository.findByIdAndUserId(
      id,
      userId,
    );
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
    const dayState = await this.dayStatesRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!dayState) {
      throw new DayStateNotFoundError();
    }

    // Serializable tx prevents race: another request assigning this dayState
    // to a day between count-check and delete.
    await this.prisma.$transaction(
      async (tx) => {
        const dayCount = await tx.day.count({ where: { dayStateId: id } });
        if (dayCount > 0) {
          throw new DayStateInUseError({ dayStateId: id, dayCount });
        }
        await tx.dayState.delete({ where: { id, userId } });
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
