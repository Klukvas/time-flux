-- DB-level constraints that Prisma cannot express natively

-- ============================================================
-- 1. Partial unique index: only one active (endDate IS NULL)
--    period per event group at a time
-- ============================================================

CREATE UNIQUE INDEX "event_periods_one_active_per_group"
  ON "event_periods"("event_group_id")
  WHERE "end_date" IS NULL;

-- ============================================================
-- 2. CHECK constraint: LOCAL users must have a password hash
-- ============================================================

ALTER TABLE "users" ADD CONSTRAINT "users_local_password_check"
  CHECK (
    "provider" != 'LOCAL' OR "password_hash" IS NOT NULL
  );
