import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { CreateDayMediaDto } from './dto/create-day-media.dto.js';
import { DayMediaResponseDto } from './dto/day-media-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe.js';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('days/:date/media')
  @ApiOperation({ summary: 'Attach uploaded media to a day' })
  @ApiParam({ name: 'date', example: '2024-01-15', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 201, type: DayMediaResponseDto })
  async addMedia(
    @CurrentUser() user: JwtPayload,
    @Param('date', ParseDatePipe) date: string,
    @Body() dto: CreateDayMediaDto,
  ): Promise<DayMediaResponseDto> {
    return this.mediaService.addMedia(user.sub, date, dto);
  }

  @Get('days/:date/media')
  @ApiOperation({ summary: 'List media for a specific day' })
  @ApiParam({ name: 'date', example: '2024-01-15', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, type: [DayMediaResponseDto] })
  async getMediaForDay(
    @CurrentUser() user: JwtPayload,
    @Param('date', ParseDatePipe) date: string,
  ): Promise<DayMediaResponseDto[]> {
    return this.mediaService.getMediaForDay(user.sub, date);
  }

  @Delete('media/:id')
  @ApiOperation({ summary: 'Delete a media item' })
  @ApiParam({ name: 'id', description: 'Media item UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.mediaService.deleteMedia(user.sub, id);
  }
}
