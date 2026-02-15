import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DaysService } from './days.service.js';
import { UpsertDayDto } from './dto/upsert-day.dto.js';
import { UpdateDayLocationDto } from './dto/update-day-location.dto.js';
import { DayQueryDto } from './dto/day-query.dto.js';
import { DayResponseDto } from './dto/day-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe.js';

@ApiTags('Days')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/days')
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  @Put(':date')
  @ApiOperation({ summary: 'Set or update the day state for a specific date' })
  @ApiParam({ name: 'date', example: '2024-01-15', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, type: DayResponseDto })
  @ApiResponse({ status: 404, description: 'Day state not found' })
  async upsert(
    @CurrentUser() user: JwtPayload,
    @Param('date', ParseDatePipe) date: string,
    @Body() dto: UpsertDayDto,
  ): Promise<DayResponseDto> {
    return this.daysService.upsert(user.sub, date, dto);
  }

  @Patch(':date/location')
  @ApiOperation({ summary: 'Update or clear the location for a specific date' })
  @ApiParam({ name: 'date', example: '2024-01-15', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, type: DayResponseDto })
  @ApiResponse({ status: 400, description: 'Future date or invalid coordinates' })
  async updateLocation(
    @CurrentUser() user: JwtPayload,
    @Param('date', ParseDatePipe) date: string,
    @Body() dto: UpdateDayLocationDto,
  ): Promise<DayResponseDto> {
    return this.daysService.updateLocation(user.sub, date, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get days with their states for a date range' })
  @ApiResponse({ status: 200, type: [DayResponseDto] })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: DayQueryDto,
  ): Promise<DayResponseDto[]> {
    return this.daysService.findAll(user.sub, query);
  }
}
