import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { S3Module } from '../s3/s3.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [HealthController],
})
export class HealthModule {}
