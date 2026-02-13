import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemoriesService } from './memories.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator.js';
import { ContextQueryDto } from './dto/context-query.dto.js';
import { OnThisDayQueryDto } from './dto/on-this-day-query.dto.js';
import type { ContextResponseDto } from './dto/context-response.dto.js';
import {
  DayContextResponseDto,
  OnThisDayResponseDto,
  WeekContextResponseDto,
} from './dto/context-response.dto.js';

@ApiTags('Memories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/memories')
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get('on-this-day')
  @ApiOperation({
    summary: 'Get "On This Day" memories',
    description:
      'Returns memories from 1 month, 6 months, and 1 year ago for the given date (defaults to today).',
  })
  @ApiResponse({
    status: 200,
    description: 'On This Day memories',
    type: OnThisDayResponseDto,
  })
  async getOnThisDay(
    @CurrentUser() user: JwtPayload,
    @Query() query: OnThisDayQueryDto,
  ): Promise<OnThisDayResponseDto> {
    return this.memoriesService.getOnThisDay(user.sub, query.date);
  }

  @Get('context')
  @ApiOperation({
    summary: 'Get context-based memories for a selected date',
    description:
      'Returns memories relative to the selected date. ' +
      'Day mode returns memories from 1 month, 6 months, and 1 year ago. ' +
      'Week mode returns weekly summaries for the same intervals.',
  })
  @ApiResponse({
    status: 200,
    description: 'Day mode response',
    type: DayContextResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Week mode response',
    type: WeekContextResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid date or mode' })
  async getContext(
    @CurrentUser() user: JwtPayload,
    @Query() query: ContextQueryDto,
  ): Promise<ContextResponseDto> {
    return this.memoriesService.getContext(user.sub, query.mode, query.date);
  }
}
