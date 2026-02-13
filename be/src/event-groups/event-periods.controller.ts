import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { EventGroupsService } from './event-groups.service.js';
import { UpdateEventPeriodDto } from './dto/update-event-period.dto.js';
import { CloseEventPeriodDto } from './dto/close-event-period.dto.js';

@ApiTags('Event Periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/periods')
export class EventPeriodsController {
  constructor(private readonly service: EventGroupsService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventPeriodDto,
  ) {
    return this.service.updatePeriod(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.deletePeriod(user.sub, id);
  }

  @Post(':id/close')
  close(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CloseEventPeriodDto,
  ) {
    return this.service.closePeriod(user.sub, id, dto);
  }
}
