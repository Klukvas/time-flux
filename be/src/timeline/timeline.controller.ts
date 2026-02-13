import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimelineService } from './timeline.service.js';
import { TimelineQueryDto, WeekQueryDto } from './dto/timeline-query.dto.js';
import { TimelineResponseDto, WeekTimelineResponseDto } from './dto/timeline-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';

@ApiTags('Timeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get vertical timeline (events + days for a date range)' })
  @ApiResponse({ status: 200, type: TimelineResponseDto })
  async getTimeline(
    @CurrentUser() user: JwtPayload,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelineResponseDto> {
    return this.timelineService.getTimeline(user.sub, query);
  }

  @Get('week')
  @ApiOperation({ summary: 'Get week view (7 days with events for a specific week)' })
  @ApiResponse({ status: 200, type: WeekTimelineResponseDto })
  async getWeekTimeline(
    @CurrentUser() user: JwtPayload,
    @Query() query: WeekQueryDto,
  ): Promise<WeekTimelineResponseDto> {
    return this.timelineService.getWeekTimeline(user.sub, query);
  }
}
