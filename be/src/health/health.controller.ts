import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller('api/v1/health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is degraded' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new HttpException(
        { status: 'degraded', database: 'disconnected' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
