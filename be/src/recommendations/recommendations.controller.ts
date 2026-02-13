import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CATEGORY_RECOMMENDATIONS, MOOD_RECOMMENDATIONS } from '../common/constants/recommendations.js';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/recommendations')
export class RecommendationsController {
  @Get()
  @ApiOperation({ summary: 'Get recommended categories and moods' })
  @ApiResponse({ status: 200, description: 'Returns recommendation lists' })
  getRecommendations() {
    return {
      categories: CATEGORY_RECOMMENDATIONS.map(({ key, color }) => ({ key, color })),
      moods: MOOD_RECOMMENDATIONS.map(({ key, color }) => ({ key, color })),
    };
  }
}
