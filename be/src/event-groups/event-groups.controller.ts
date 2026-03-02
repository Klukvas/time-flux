import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateEventGroupDto } from './dto/create-event-group.dto.js';
import { UpdateEventGroupDto } from './dto/update-event-group.dto.js';
import { CreateEventPeriodDto } from './dto/create-event-period.dto.js';
import { EventGroupResponseDto } from './dto/event-group-response.dto.js';
import { EventGroupDetailsResponseDto } from './dto/event-group-details-response.dto.js';

@ApiTags('Event Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/event-groups')
export class EventGroupsController {
  constructor(private readonly service: EventGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create event group' })
  @ApiResponse({
    status: 201,
    description: 'Event group created',
    type: EventGroupResponseDto,
  })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEventGroupDto) {
    return this.service.createGroup(user.sub, dto, user.timezone);
  }

  @Get()
  @ApiOperation({ summary: 'List event groups' })
  @ApiResponse({
    status: 200,
    description: 'List of event groups',
    type: [EventGroupResponseDto],
  })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAllGroups(user.sub, user.timezone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event group by ID' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event group found',
    type: EventGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findGroupById(user.sub, id, user.timezone);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event group updated',
    type: EventGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEventGroupDto,
  ) {
    return this.service.updateGroup(user.sub, id, dto, user.timezone);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 204, description: 'Event group deleted' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteGroup(user.sub, id);
  }

  @Post(':id/periods')
  @ApiOperation({ summary: 'Create period for event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({
    status: 201,
    description: 'Period created',
    type: EventGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  createPeriod(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateEventPeriodDto,
  ) {
    return this.service.createPeriod(user.sub, id, dto, user.timezone);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get event group details with analytics' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event group details',
    type: EventGroupDetailsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  getDetails(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getGroupDetails(user.sub, id, user.timezone);
  }
}
