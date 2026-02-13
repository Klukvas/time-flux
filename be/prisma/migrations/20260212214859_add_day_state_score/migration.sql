-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "day_media" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "day_states" ADD COLUMN     "score" SMALLINT NOT NULL DEFAULT 5,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- Backfill scores for system moods based on order
UPDATE "day_states" SET "score" = 9 WHERE "is_system" = true AND "order" = 0;
UPDATE "day_states" SET "score" = 7 WHERE "is_system" = true AND "order" = 1;
UPDATE "day_states" SET "score" = 5 WHERE "is_system" = true AND "order" = 2;
UPDATE "day_states" SET "score" = 3 WHERE "is_system" = true AND "order" = 3;
UPDATE "day_states" SET "score" = 1 WHERE "is_system" = true AND "order" = 4;

-- Backfill scores for custom moods: interpolate from order (higher order = lower score)
UPDATE "day_states" ds SET "score" = GREATEST(0, LEAST(10,
  ROUND(10 - ("order" * 10.0 / GREATEST(
    (SELECT MAX(d2."order") FROM "day_states" d2 WHERE d2."user_id" = ds."user_id"), 1
  )))
))::SMALLINT
WHERE "is_system" = false;

-- AlterTable
ALTER TABLE "days" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "event_periods" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;
