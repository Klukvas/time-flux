-- AlterTable
ALTER TABLE "users" ADD COLUMN "birth_date" DATE;

-- Validate: birth_date must be between 1900-01-01 and today
ALTER TABLE "users" ADD CONSTRAINT "users_birth_date_valid_range" CHECK ("birth_date" >= '1900-01-01' AND "birth_date" <= CURRENT_DATE);
