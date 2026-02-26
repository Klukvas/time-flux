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
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { EventGroupsService } from './event-groups.service.js';
import { CreateEventGroupDto } from './dto/create-event-group.dto.js';
import { UpdateEventGroupDto } from './dto/update-event-group.dto.js';
import { CreateEventPeriodDto } from './dto/create-event-period.dto.js';

@ApiTags('Event Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/event-groups')
export class EventGroupsController {
  constructor(private readonly service: EventGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create event group' })
  @ApiResponse({ status: 201, description: 'Event group created' })
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateEventGroupDto,
  ) {
    return this.service.createGroup(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List event groups' })
  @ApiResponse({ status: 200, description: 'List of event groups' })
  findAll(@CurrentUser() user: { sub: string }) {
    return this.service.findAllGroups(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event group by ID' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 200, description: 'Event group found' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  findOne(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.findGroupById(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 200, description: 'Event group updated' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventGroupDto,
  ) {
    return this.service.updateGroup(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 204, description: 'Event group deleted' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.deleteGroup(user.sub, id);
  }

  @Post(':id/periods')
  @ApiOperation({ summary: 'Create period for event group' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 201, description: 'Period created' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  createPeriod(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CreateEventPeriodDto,
  ) {
    return this.service.createPeriod(user.sub, id, dto);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get event group details with analytics' })
  @ApiParam({ name: 'id', description: 'Event group UUID' })
  @ApiResponse({ status: 200, description: 'Event group details' })
  @ApiResponse({ status: 404, description: 'Event group not found' })
  getDetails(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.getGroupDetails(user.sub, id);
  }
}
