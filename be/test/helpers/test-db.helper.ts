import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

const TABLES_TO_TRUNCATE = [
  'webhook_events',
  'day_media',
  'days',
  'event_periods',
  'event_groups',
  'categories',
  'day_states',
  'refresh_tokens',
  'subscriptions',
  'users',
].join(', ');

export function getPrisma(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

export async function truncateAllTables(app: INestApplication): Promise<void> {
  const prisma = getPrisma(app);
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${TABLES_TO_TRUNCATE} CASCADE`,
  );
}
