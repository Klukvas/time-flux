import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { MediaRepository } from './media.repository.js';
import { S3Module } from '../s3/s3.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [S3Module, AuthModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
})
export class MediaModule {}
