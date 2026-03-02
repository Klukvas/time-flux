import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator.js';
import { EventGroupsService } from './event-groups.service.js';
import { UpdateEventPeriodDto } from './dto/update-event-period.dto.js';
import { CloseEventPeriodDto } from './dto/close-event-period.dto.js';
import { EventGroupResponseDto } from './dto/event-group-response.dto.js';

@ApiTags('Event Periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/periods')
export class EventPeriodsController {
  constructor(private readonly service: EventGroupsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update event period' })
  @ApiParam({ name: 'id', description: 'Event period UUID' })
  @ApiResponse({
    status: 200,
    description: 'Period updated',
    type: EventGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Period not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEventPeriodDto,
  ) {
    return this.service.updatePeriod(user.sub, id, dto, user.timezone);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event period' })
  @ApiParam({ name: 'id', description: 'Event period UUID' })
  @ApiResponse({ status: 204, description: 'Period deleted' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deletePeriod(user.sub, id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close an active event period' })
  @ApiParam({ name: 'id', description: 'Event period UUID' })
  @ApiResponse({
    status: 200,
    description: 'Period closed',
    type: EventGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Period not found' })
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CloseEventPeriodDto,
  ) {
    return this.service.closePeriod(user.sub, id, dto, user.timezone);
  }
}
