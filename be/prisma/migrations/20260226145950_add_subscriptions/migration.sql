-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paddle_customer_id" TEXT,
    "paddle_subscription_id" TEXT,
    "current_period_end" TIMESTAMPTZ,
    "canceled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_paddle_customer_id_key" ON "subscriptions"("paddle_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_paddle_subscription_id_key" ON "subscriptions"("paddle_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_paddle_customer_id_idx" ON "subscriptions"("paddle_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_paddle_subscription_id_idx" ON "subscriptions"("paddle_subscription_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
