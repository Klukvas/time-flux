import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
import { ChangePlanDto, ChangePlanResponseDto } from './dto/change-plan.dto.js';

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

  @Get('prices')
  @ApiOperation({ summary: 'Get subscription tier prices from Paddle' })
  @ApiResponse({ status: 200 })
  async getPrices() {
    return this.subscriptionsService.getPrices();
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, type: CancelResponseDto })
  async cancelSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.cancelSubscription(user.sub);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate a canceled subscription' })
  @ApiResponse({ status: 200 })
  async reactivateSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.reactivateSubscription(user.sub);
  }

  @Post('change-plan')
  @ApiOperation({
    summary: 'Change subscription plan (upgrade or downgrade) via Paddle',
  })
  @ApiResponse({ status: 200, type: ChangePlanResponseDto })
  async changePlan(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(user.sub, dto.tier);
  }
}
