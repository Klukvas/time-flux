-- CreateTable
CREATE TABLE "day_media" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "day_media_day_id_idx" ON "day_media"("day_id");

-- CreateIndex
CREATE INDEX "day_media_user_id_idx" ON "day_media"("user_id");

-- AddForeignKey
ALTER TABLE "day_media" ADD CONSTRAINT "day_media_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_media" ADD CONSTRAINT "day_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
