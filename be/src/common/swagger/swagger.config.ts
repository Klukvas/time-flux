import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
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
}
