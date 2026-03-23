import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { DayStatesModule } from './day-states/day-states.module.js';
import { EventGroupsModule } from './event-groups/event-groups.module.js';
import { DaysModule } from './days/days.module.js';
import { TimelineModule } from './timeline/timeline.module.js';
import { S3Module } from './s3/s3.module.js';
import { MediaModule } from './media/media.module.js';
import { MemoriesModule } from './memories/memories.module.js';
import { RecommendationsModule } from './recommendations/recommendations.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { HealthModule } from './health/health.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { UsersModule } from './users/users.module.js';
import { SentryModule } from '@sentry/nestjs/setup';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        transport: isProduction ? undefined : { target: 'pino-pretty' },
        autoLogging: true,
        quietReqLogger: true,
        redact: ['req.headers.authorization'],
      },
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    DayStatesModule,
    EventGroupsModule,
    DaysModule,
    TimelineModule,
    S3Module,
    MediaModule,
    MemoriesModule,
    RecommendationsModule,
    AnalyticsModule,
    HealthModule,
    SubscriptionsModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
