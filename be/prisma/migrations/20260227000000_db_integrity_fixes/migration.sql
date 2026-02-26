-- 2.1 UNIQUE on refresh_tokens.token_hash
DROP INDEX IF EXISTS "refresh_tokens_token_hash_idx";
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- 2.2 UNIQUE on day_media.s3_key
CREATE UNIQUE INDEX "day_media_s3_key_key" ON "day_media"("s3_key");

-- 2.3 Indexes on webhook_events
CREATE INDEX "webhook_events_processed_created_at_idx" ON "webhook_events"("processed", "created_at");
CREATE INDEX "webhook_events_type_idx" ON "webhook_events"("type");

-- 2.4 CHECK on day_states.score (0–10)
ALTER TABLE "day_states" ADD CONSTRAINT "day_states_score_check" CHECK ("score" >= 0 AND "score" <= 10);

-- 2.5 Lat/lng co-presence on days
ALTER TABLE "days" ADD CONSTRAINT "days_latlng_copresence_check" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));

-- 2.6 Remove redundant days(userId, date) index (unique constraint already covers it)
DROP INDEX IF EXISTS "days_user_id_date_idx";

-- 2.7 Composite index day_media(dayId, userId)
CREATE INDEX "day_media_day_id_user_id_idx" ON "day_media"("day_id", "user_id");

-- 2.8 Index on event_groups.categoryId
CREATE INDEX "event_groups_category_id_idx" ON "event_groups"("category_id");
