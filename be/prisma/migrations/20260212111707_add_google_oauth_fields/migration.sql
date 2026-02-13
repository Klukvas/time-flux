-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_id" TEXT,
ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "avatar_url" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
