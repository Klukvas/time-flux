import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SupportService } from './support.service.js';
import { CreateSupportRequestDto } from './dto/create-support-request.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator.js';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Send a support request via Telegram' })
  @ApiResponse({ status: 204, description: 'Support request sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupportRequestDto,
  ): Promise<void> {
    await this.supportService.sendSupportRequest(dto, user.email);
  }
}
