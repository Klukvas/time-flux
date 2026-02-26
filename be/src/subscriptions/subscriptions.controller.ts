import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator.js';
import {
  SubscriptionResponseDto,
  CancelResponseDto,
} from './dto/subscription-response.dto.js';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current subscription with tier limits' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getSubscription(user.sub);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, type: CancelResponseDto })
  async cancelSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.cancelSubscription(user.sub);
  }
}
