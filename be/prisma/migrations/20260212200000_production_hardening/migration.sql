-- Phase 1 & 2: Production Hardening Migration
-- Adds updatedAt fields, unique constraints, indexes, FK for mainMediaId, RefreshToken table

-- ============================================================
-- 1. Add updatedAt columns with default value for existing rows
-- ============================================================

-- Users
ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Categories
ALTER TABLE "categories" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DayStates
ALTER TABLE "day_states" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- EventPeriods (already has created_at, add updated_at)
ALTER TABLE "event_periods" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Days
ALTER TABLE "days" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DayMedia
ALTER TABLE "day_media" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 2. Unique constraints for Category and DayState (userId, name)
-- ============================================================

-- De-duplicate categories before adding constraint (keep first by id)
DELETE FROM "categories" a USING "categories" b
WHERE a."user_id" = b."user_id" AND a."name" = b."name" AND a."id" > b."id";

CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- De-duplicate day_states before adding constraint
DELETE FROM "day_states" a USING "day_states" b
WHERE a."user_id" = b."user_id" AND a."name" = b."name" AND a."id" > b."id";

CREATE UNIQUE INDEX "day_states_user_id_name_key" ON "day_states"("user_id", "name");

-- ============================================================
-- 3. FK: Day.mainMediaId → DayMedia.id with onDelete: SetNull
-- ============================================================

-- Clear any invalid mainMediaId references before adding FK
UPDATE "days" SET "main_media_id" = NULL
WHERE "main_media_id" IS NOT NULL
  AND "main_media_id" NOT IN (SELECT "id" FROM "day_media");

-- De-duplicate mainMediaId (must be unique) — keep first occurrence
UPDATE "days" d SET "main_media_id" = NULL
FROM (
  SELECT "id" FROM "days"
  WHERE "main_media_id" IS NOT NULL
    AND "id" NOT IN (
      SELECT DISTINCT ON ("main_media_id") "id"
      FROM "days"
      WHERE "main_media_id" IS NOT NULL
      ORDER BY "main_media_id", "id"
    )
) dup
WHERE d."id" = dup."id";

CREATE UNIQUE INDEX "days_main_media_id_key" ON "days"("main_media_id");

ALTER TABLE "days" ADD CONSTRAINT "days_main_media_id_fkey"
  FOREIGN KEY ("main_media_id") REFERENCES "day_media"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 4. Performance indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS "days_user_id_day_state_id_idx" ON "days"("user_id", "day_state_id");
CREATE INDEX IF NOT EXISTS "event_periods_event_group_id_end_date_idx" ON "event_periods"("event_group_id", "end_date");

-- ============================================================
-- 5. RefreshToken table
-- ============================================================

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
