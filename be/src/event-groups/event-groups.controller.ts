import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { EventGroupsService } from './event-groups.service.js';
import { CreateEventGroupDto } from './dto/create-event-group.dto.js';
import { UpdateEventGroupDto } from './dto/update-event-group.dto.js';
import { CreateEventPeriodDto } from './dto/create-event-period.dto.js';
import { EventGroupQueryDto } from './dto/event-group-query.dto.js';

@ApiTags('Event Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/event-groups')
export class EventGroupsController {
  constructor(private readonly service: EventGroupsService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateEventGroupDto) {
    return this.service.createGroup(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { sub: string }, @Query() query: EventGroupQueryDto) {
    return this.service.findAllGroups(user.sub, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.findGroupById(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventGroupDto,
  ) {
    return this.service.updateGroup(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.deleteGroup(user.sub, id);
  }

  @Post(':id/periods')
  createPeriod(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CreateEventPeriodDto,
  ) {
    return this.service.createPeriod(user.sub, id, dto);
  }

  @Get(':id/details')
  getDetails(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.getGroupDetails(user.sub, id);
  }
}
