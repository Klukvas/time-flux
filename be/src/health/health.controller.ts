import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from '../s3/s3.service.js';

class ComponentsDto {
  @ApiProperty({ example: 'connected' })
  database: string;

  @ApiProperty({ example: 'connected' })
  s3: string;
}

class LiveResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;
}

class ReadyResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ type: ComponentsDto })
  components: ComponentsDto;
}

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'connected' })
  database: string;
}

@ApiTags('Health')
@Controller('api/v1/health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({
    status: 200,
    description: 'Process is alive',
    type: LiveResponseDto,
  })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    type: ReadyResponseDto,
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    const components = {
      database: 'connected',
      s3: 'connected',
    };

    const checks = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.s3Service.checkConnection(),
    ]);

    if (checks[0].status === 'rejected') {
      components.database = 'disconnected';
    }
    if (checks[1].status === 'rejected') {
      components.s3 = 'disconnected';
    }

    const hasFailure = Object.values(components).some(
      (value) => value !== 'connected',
    );

    if (hasFailure) {
      throw new HttpException(
        { status: 'degraded', components },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok', components };
  }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthResponseDto,
  })
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
