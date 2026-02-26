/**
 * Backfill FREE subscriptions for all existing users who don't have one.
 *
 * Run with: npx tsx prisma/scripts/backfill-subscriptions.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const usersWithoutSub = await prisma.user.findMany({
      where: { subscription: null },
      select: { id: true, email: true },
    });

    console.log(
      `Found ${usersWithoutSub.length} users without a subscription.`,
    );

    if (usersWithoutSub.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    const result = await prisma.subscription.createMany({
      data: usersWithoutSub.map((u) => ({
        userId: u.id,
        tier: 'FREE' as const,
        status: 'ACTIVE' as const,
      })),
      skipDuplicates: true,
    });

    console.log(`Created ${result.count} FREE subscriptions.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
