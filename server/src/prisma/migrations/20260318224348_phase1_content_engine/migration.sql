-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('SPARK', 'DEVELOPING', 'READY', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentType" ADD VALUE 'PUBLISHING';
ALTER TYPE "AgentType" ADD VALUE 'LISTENING';
ALTER TYPE "AgentType" ADD VALUE 'COMPETITIVE';
ALTER TYPE "AgentType" ADD VALUE 'CAMPAIGN';
ALTER TYPE "AgentType" ADD VALUE 'COLLABORATION';
ALTER TYPE "AgentType" ADD VALUE 'LINK_IN_BIO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'TWITTER';
ALTER TYPE "Platform" ADD VALUE 'LINKEDIN';
ALTER TYPE "Platform" ADD VALUE 'THREADS';
ALTER TYPE "Platform" ADD VALUE 'BLUESKY';
ALTER TYPE "Platform" ADD VALUE 'FACEBOOK';
ALTER TYPE "Platform" ADD VALUE 'PINTEREST';

-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'THREAD';

-- AlterTable
ALTER TABLE "content_posts" ADD COLUMN     "bulkGroupId" TEXT,
ADD COLUMN     "firstComment" TEXT,
ADD COLUMN     "ideaId" TEXT,
ADD COLUMN     "platformOverrides" JSONB;

-- CreateTable
CREATE TABLE "content_ideas" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'SPARK',
    "source" TEXT,
    "mediaUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_idea_tags" (
    "ideaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "content_idea_tags_pkey" PRIMARY KEY ("ideaId","tagId")
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "platform" "Platform",
    "category" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_schedules" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_ideas_creatorProfileId_status_idx" ON "content_ideas"("creatorProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "content_tags_creatorProfileId_name_key" ON "content_tags"("creatorProfileId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "posting_schedules_creatorProfileId_platform_dayOfWeek_timeS_key" ON "posting_schedules"("creatorProfileId", "platform", "dayOfWeek", "timeSlot");

-- CreateIndex
CREATE INDEX "content_posts_bulkGroupId_idx" ON "content_posts"("bulkGroupId");

-- AddForeignKey
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_idea_tags" ADD CONSTRAINT "content_idea_tags_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "content_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_idea_tags" ADD CONSTRAINT "content_idea_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "content_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_schedules" ADD CONSTRAINT "posting_schedules_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
