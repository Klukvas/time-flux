-- AlterTable: add comment field to days
ALTER TABLE "days" ADD COLUMN "comment" VARCHAR(500);

-- Add CHECK constraint: EventPeriod end_date must be >= start_date (when not null)
ALTER TABLE "event_periods"
ADD CONSTRAINT "event_periods_date_order_check"
  CHECK ("end_date" IS NULL OR "start_date" <= "end_date");

-- Add CHECK constraint: Day latitude must be in valid range
ALTER TABLE "days"
ADD CONSTRAINT "days_valid_latitude_check"
  CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90));

-- Add CHECK constraint: Day longitude must be in valid range
ALTER TABLE "days"
ADD CONSTRAINT "days_valid_longitude_check"
  CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180));
