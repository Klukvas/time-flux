import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { S3Service } from './s3.service.js';
import { PresignedUrlRequestDto, PresignedUrlResponseDto } from './dto/presigned-url.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/uploads')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Generate a presigned URL for direct S3 upload (Hetzner S3-compatible)' })
  @ApiResponse({ status: 201, type: PresignedUrlResponseDto })
  async getPresignedUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PresignedUrlRequestDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.s3Service.generatePresignedUploadUrl(user.sub, dto.contentType, dto.size);
  }
}
