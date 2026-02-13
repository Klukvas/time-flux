-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_category_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "events";
