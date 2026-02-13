import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DayStatesService } from './day-states.service.js';
import { CreateDayStateDto } from './dto/create-day-state.dto.js';
import { UpdateDayStateDto } from './dto/update-day-state.dto.js';
import { CreateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import { DayStateResponseDto } from './dto/day-state-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';

@ApiTags('Day States')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/day-states')
export class DayStatesController {
  constructor(private readonly dayStatesService: DayStatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all day states for the current user' })
  @ApiResponse({ status: 200, type: [DayStateResponseDto] })
  async findAll(@CurrentUser() user: JwtPayload): Promise<DayStateResponseDto[]> {
    return this.dayStatesService.findAll(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new day state' })
  @ApiResponse({ status: 201, type: DayStateResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDayStateDto,
  ): Promise<DayStateResponseDto> {
    return this.dayStatesService.create(user.sub, dto);
  }

  @Post('from-recommendation')
  @ApiOperation({ summary: 'Create a day state from a recommendation' })
  @ApiResponse({ status: 201, type: DayStateResponseDto })
  @ApiResponse({ status: 400, description: 'Unknown recommendation key' })
  async createFromRecommendation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFromRecommendationDto,
  ): Promise<DayStateResponseDto> {
    return this.dayStatesService.createFromRecommendation(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a day state' })
  @ApiResponse({ status: 200, type: DayStateResponseDto })
  @ApiResponse({ status: 404, description: 'Day state not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDayStateDto,
  ): Promise<DayStateResponseDto> {
    return this.dayStatesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a day state' })
  @ApiResponse({ status: 204, description: 'Day state deleted' })
  @ApiResponse({ status: 404, description: 'Day state not found' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.dayStatesService.delete(user.sub, id);
  }
}
