import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { UsersRepository } from './users.repository.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ValidationError } from '../common/errors/app.error.js';

const MIN_AGE_YEARS = 13;
const MAX_AGE_YEARS = 130;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`updateProfile userId=${userId}`);

    if (dto.birthDate !== undefined) {
      // Validate input first, then check tier access
      const birthDate =
        dto.birthDate === null ? null : this.validateBirthDate(dto.birthDate);

      await this.subscriptionsService.assertFeatureAccess(userId, 'birthDate');

      const user = await this.usersRepository.updateBirthDate(
        userId,
        birthDate,
      );
      this.logger.log(`updateProfile success userId=${userId}`);
      return this.buildUserResponse(user, userId);
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ValidationError({ userId: 'User not found' });
    }
    return this.buildUserResponse(user, userId);
  }

  private validateBirthDate(dateStr: string): Date {
    const date = DateTime.fromISO(dateStr, { zone: 'utc' }).startOf('day');

    if (!date.isValid) {
      throw new ValidationError({ birthDate: 'Invalid date format' });
    }

    const today = DateTime.now().setZone('utc').startOf('day');

    if (date > today) {
      throw new ValidationError({
        birthDate: 'Birth date cannot be in the future',
      });
    }

    const age = today.diff(date, 'years').years;

    if (age < MIN_AGE_YEARS) {
      throw new ValidationError({
        birthDate: `You must be at least ${MIN_AGE_YEARS} years old`,
      });
    }

    if (age > MAX_AGE_YEARS) {
      throw new ValidationError({
        birthDate: `Birth date cannot be more than ${MAX_AGE_YEARS} years ago`,
      });
    }

    return date.toJSDate();
  }

  private async buildUserResponse(
    user: {
      id: string;
      email: string;
      avatarUrl?: string | null;
      timezone: string;
      onboardingCompleted: boolean;
      birthDate?: Date | null;
      createdAt: Date;
    },
    userId: string,
  ) {
    const tier = await this.subscriptionsService.getTier(userId);
    return {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
      tier,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().split('T')[0]
        : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
