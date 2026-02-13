-- CreateTable
CREATE TABLE "event_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_periods" (
    "id" TEXT NOT NULL,
    "event_group_id" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "comment" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_groups_user_id_idx" ON "event_groups"("user_id");

-- CreateIndex
CREATE INDEX "event_groups_user_id_category_id_idx" ON "event_groups"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "event_periods_event_group_id_idx" ON "event_periods"("event_group_id");

-- CreateIndex
CREATE INDEX "event_periods_event_group_id_start_date_idx" ON "event_periods"("event_group_id", "start_date");

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_periods" ADD CONSTRAINT "event_periods_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "event_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: Event → EventGroup (reuse Event.id as EventGroup.id)
INSERT INTO event_groups (id, user_id, category_id, title, description, created_at, updated_at)
SELECT
  e.id, e.user_id, e.category_id,
  c.name || ' ' || ROW_NUMBER() OVER (PARTITION BY e.user_id, e.category_id ORDER BY e.created_at),
  NULL, e.created_at, e.created_at
FROM events e
JOIN categories c ON c.id = e.category_id;

-- MigrateData: Event → EventPeriod
INSERT INTO event_periods (id, event_group_id, start_date, end_date, comment, created_at)
SELECT gen_random_uuid(), id, start_date, end_date, comment, created_at
FROM events;
