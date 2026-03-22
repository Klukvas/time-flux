-- AlterTable
ALTER TABLE "day_media" ADD COLUMN "period_id" TEXT;

-- CreateIndex
CREATE INDEX "day_media_period_id_idx" ON "day_media"("period_id");

-- AddForeignKey
ALTER TABLE "day_media" ADD CONSTRAINT "day_media_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "event_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
