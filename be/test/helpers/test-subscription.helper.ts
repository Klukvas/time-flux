import type { INestApplication } from '@nestjs/common';
import type { SubscriptionTier } from '@prisma/client';
import { getPrisma } from './test-db.helper';

/** Set user subscription tier directly via Prisma (bypass Paddle). */
export async function setUserTier(
  app: INestApplication,
  userId: string,
  tier: SubscriptionTier,
): Promise<void> {
  const prisma = getPrisma(app);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, tier, status: 'ACTIVE' },
    update: { tier, status: 'ACTIVE' },
  });
}
