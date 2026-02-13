import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { MoodOverviewResponseDto } from './dto/mood-overview.dto.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('mood-overview')
  @ApiOperation({ summary: 'Get global mood analytics overview with weekday behavioral insights' })
  @ApiResponse({ status: 200, description: 'Mood overview with distribution, category stats, 30-day trend, and weekday insights', type: MoodOverviewResponseDto })
  async getMoodOverview(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getMoodOverview(user.sub);
  }
}
