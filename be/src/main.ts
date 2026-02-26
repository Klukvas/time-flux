import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import type { NestExpressApplication } from '@nestjs/platform-express';

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const PRODUCTION_REQUIRED_ENV_VARS = ['FRONTEND_URL'];

function validateEnv() {
  const required =
    process.env.NODE_ENV === 'production'
      ? [...REQUIRED_ENV_VARS, ...PRODUCTION_REQUIRED_ENV_VARS]
      : REQUIRED_ENV_VARS;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // ── Graceful shutdown ──────────────────────────────────────
  app.enableShutdownHooks();

  // ── Security: Helmet (must come before CORS) ──────────────────
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── Security: CORS whitelist ───────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl
    ? [frontendUrl]
    : ['http://localhost:3001', 'http://localhost:8081'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // ── Security: Request body size limits ─────────────────────────
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // ── Validation ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger (disabled in production) ───────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LifeSpan API')
      .setDescription(
        'Backend API for Life Timeline — build a visual timeline of your life',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'User registration and login')
      .addTag('Categories', 'User-defined event categories with colors')
      .addTag('Day States', 'User-defined day states (moods) with colors')
      .addTag('Event Groups', 'Chapters — reusable event groups')
      .addTag('Event Periods', 'Dated periods within event groups')
      .addTag('Days', 'Per-day visual state management')
      .addTag('Timeline', 'Read-only timeline views (vertical + week)')
      .addTag('Uploads', 'S3-compatible presigned URL generation')
      .addTag('Memories', 'Memory resurfacing — "On This Day"')
      .addTag('Analytics', 'Emotional pattern detection and mood analytics')
      .addTag('Subscriptions', 'Subscription management and billing')
      .addTag('Health', 'Health check endpoint')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}
bootstrap();
