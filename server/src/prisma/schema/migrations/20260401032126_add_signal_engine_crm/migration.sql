/*
  Warnings:

  - You are about to drop the column `tier` on the `usage_budgets` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InboxChannelType" AS ENUM ('INSTAGRAM_DM', 'WHATSAPP', 'EMAIL', 'BRAND_INQUIRY');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "PostActivityAction" AS ENUM ('CREATED', 'EDITED', 'STATUS_CHANGED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'MEDIA_ADDED', 'MEDIA_REMOVED', 'CAPTION_EDITED', 'HASHTAGS_UPDATED', 'PLATFORM_ADAPTED', 'CLONED', 'ARCHIVED', 'COMMENT_ADDED');

-- CreateEnum
CREATE TYPE "MentionIntent" AS ENUM ('BUYING', 'QUESTION', 'COMPLAINT', 'PRAISE', 'COLLAB', 'OTHER');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('TREND', 'LEAD', 'RISK', 'VIRAL_POST');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('NEW', 'ACTIONED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BRAND', 'FAN', 'CREATOR', 'AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('DM', 'COMMENT', 'MENTION', 'EMAIL', 'IMPORT', 'MANUAL');

-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('BRAND_DEAL', 'YOUTUBE_ADSENSE', 'AFFILIATE', 'SPONSORSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PAID', 'CANCELLED', 'LOST');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'RAZORPAY', 'NONE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentType" ADD VALUE 'GROWTH';
ALTER TYPE "AgentType" ADD VALUE 'STUDIO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'EMAIL';
ALTER TYPE "InteractionType" ADD VALUE 'WHATSAPP';
ALTER TYPE "InteractionType" ADD VALUE 'BRAND_INQUIRY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DAILY_RECOMMENDATION';
ALTER TYPE "NotificationType" ADD VALUE 'BRAND_INQUIRY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OAuthProvider" ADD VALUE 'TWITTER';
ALTER TYPE "OAuthProvider" ADD VALUE 'LINKEDIN';
ALTER TYPE "OAuthProvider" ADD VALUE 'THREADS';
ALTER TYPE "OAuthProvider" ADD VALUE 'BLUESKY';
ALTER TYPE "OAuthProvider" ADD VALUE 'FACEBOOK';
ALTER TYPE "OAuthProvider" ADD VALUE 'PINTEREST';
ALTER TYPE "OAuthProvider" ADD VALUE 'MASTODON';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'REDDIT';
ALTER TYPE "Platform" ADD VALUE 'GOOGLE_BUSINESS';

-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'PENDING_MANUAL';

-- AlterTable
ALTER TABLE "analytics_reports" ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "brandLogo" TEXT,
ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "isWhiteLabel" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "community_interactions" ADD COLUMN     "channelMetadata" JSONB,
ADD COLUMN     "isStarred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "threadId" TEXT;

-- AlterTable
ALTER TABLE "content_posts" ADD COLUMN     "adSpend" DOUBLE PRECISION,
ADD COLUMN     "isBoosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastRecurredAt" TIMESTAMP(3),
ADD COLUMN     "maxRecurrences" INTEGER,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "parentPostId" TEXT,
ADD COLUMN     "recurrenceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "repostSourceUrl" TEXT,
ADD COLUMN     "repostType" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourcePostId" TEXT,
ADD COLUMN     "threadOrder" INTEGER,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "paymentDetails" JSONB;

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "mentions" ADD COLUMN     "authorFollowers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "influenceScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "intent" "MentionIntent",
ADD COLUMN     "isConverted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opportunityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "urgencyScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "oauth_accounts" ADD COLUMN     "paused" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "post_analytics" ADD COLUMN     "estimatedRevenue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "usage_budgets" DROP COLUMN "tier";

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "aiAutoSuggest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "aiTone" TEXT NOT NULL DEFAULT 'friendly',
ADD COLUMN     "autoSchedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultHashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "defaultPlatform" TEXT,
ADD COLUMN     "defaultPostType" TEXT,
ADD COLUMN     "notifyCampaignUpdate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyCommentReply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMention" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyNewFollower" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profileVisibility" TEXT NOT NULL DEFAULT 'public',
ADD COLUMN     "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushSubscription" JSONB,
ADD COLUMN     "showAnalytics" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "hashtag_analytics" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "hashtag" TEXT NOT NULL,
    "platform" "Platform",
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtag_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_channels" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "type" "InboxChannelType" NOT NULL,
    "label" TEXT,
    "config" JSONB,
    "status" "ChannelStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_notes" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_activity_logs" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "PostActivityAction" NOT NULL,
    "details" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rss_feeds" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoCreateIdeas" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastItemGuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceMentionId" TEXT,
    "opportunityScore" INTEGER NOT NULL DEFAULT 0,
    "status" "SignalStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "platform" "Platform",
    "email" TEXT,
    "type" "ContactType" NOT NULL DEFAULT 'OTHER',
    "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "relationshipScore" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "lastInteractionAt" TIMESTAMP(3),
    "sourceMentionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_streams" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "type" "RevenueType" NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "period" TEXT,
    "campaignId" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "brandDealId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_deals" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "contactId" TEXT,
    "brandName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "dealValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "deliverables" TEXT[],
    "status" "DealStatus" NOT NULL DEFAULT 'PROSPECT',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expectedValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "UsageTier" NOT NULL DEFAULT 'FREE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'NONE',
    "providerSubscriptionId" TEXT,
    "providerCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hashtag_analytics_creatorProfileId_idx" ON "hashtag_analytics"("creatorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_analytics_creatorProfileId_hashtag_platform_key" ON "hashtag_analytics"("creatorProfileId", "hashtag", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_channels_creatorProfileId_type_key" ON "inbox_channels"("creatorProfileId", "type");

-- CreateIndex
CREATE INDEX "calendar_notes_creatorProfileId_date_idx" ON "calendar_notes"("creatorProfileId", "date");

-- CreateIndex
CREATE INDEX "post_activity_logs_postId_createdAt_idx" ON "post_activity_logs"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "post_activity_logs_userId_idx" ON "post_activity_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rss_feeds_creatorProfileId_url_key" ON "rss_feeds"("creatorProfileId", "url");

-- CreateIndex
CREATE INDEX "signals_userId_status_idx" ON "signals"("userId", "status");

-- CreateIndex
CREATE INDEX "signals_userId_type_idx" ON "signals"("userId", "type");

-- CreateIndex
CREATE INDEX "signals_opportunityScore_idx" ON "signals"("opportunityScore");

-- CreateIndex
CREATE INDEX "contacts_userId_type_idx" ON "contacts"("userId", "type");

-- CreateIndex
CREATE INDEX "contacts_userId_relationshipScore_idx" ON "contacts"("userId", "relationshipScore");

-- CreateIndex
CREATE INDEX "contacts_handle_platform_idx" ON "contacts"("handle", "platform");

-- CreateIndex
CREATE INDEX "revenue_streams_creatorProfileId_type_idx" ON "revenue_streams"("creatorProfileId", "type");

-- CreateIndex
CREATE INDEX "revenue_streams_creatorProfileId_period_idx" ON "revenue_streams"("creatorProfileId", "period");

-- CreateIndex
CREATE INDEX "invoices_creatorProfileId_status_idx" ON "invoices"("creatorProfileId", "status");

-- CreateIndex
CREATE INDEX "brand_deals_creatorProfileId_status_idx" ON "brand_deals"("creatorProfileId", "status");

-- CreateIndex
CREATE INDEX "brand_deals_contactId_idx" ON "brand_deals"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_trialEnd_idx" ON "subscriptions"("trialEnd");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_subscriptionId_idx" ON "payment_transactions"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "content_posts_parentPostId_idx" ON "content_posts"("parentPostId");

-- CreateIndex
CREATE INDEX "content_posts_isRecurring_status_idx" ON "content_posts"("isRecurring", "status");

-- CreateIndex
CREATE INDEX "mentions_queryId_intent_idx" ON "mentions"("queryId", "intent");

-- CreateIndex
CREATE INDEX "mentions_opportunityScore_idx" ON "mentions"("opportunityScore");

-- AddForeignKey
ALTER TABLE "hashtag_analytics" ADD CONSTRAINT "hashtag_analytics_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_channels" ADD CONSTRAINT "inbox_channels_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "content_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_notes" ADD CONSTRAINT "calendar_notes_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_activity_logs" ADD CONSTRAINT "post_activity_logs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_activity_logs" ADD CONSTRAINT "post_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rss_feeds" ADD CONSTRAINT "rss_feeds_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_sourceMentionId_fkey" FOREIGN KEY ("sourceMentionId") REFERENCES "mentions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_streams" ADD CONSTRAINT "revenue_streams_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_streams" ADD CONSTRAINT "revenue_streams_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_brandDealId_fkey" FOREIGN KEY ("brandDealId") REFERENCES "brand_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_deals" ADD CONSTRAINT "brand_deals_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_deals" ADD CONSTRAINT "brand_deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
