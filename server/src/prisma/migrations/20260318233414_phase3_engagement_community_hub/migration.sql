-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "community_interactions" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "caseStatus" "CaseStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "MessagePriority",
ADD COLUMN     "tags" TEXT[];

-- CreateTable
CREATE TABLE "saved_replies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_scores" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_voice_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tonePreferences" TEXT[],
    "exampleReplies" TEXT[],
    "vocabulary" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_voice_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_replies_userId_idx" ON "saved_replies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_scores_creatorProfileId_period_key" ON "comment_scores"("creatorProfileId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "user_voice_profiles_userId_key" ON "user_voice_profiles"("userId");

-- CreateIndex
CREATE INDEX "community_interactions_creatorProfileId_caseStatus_idx" ON "community_interactions"("creatorProfileId", "caseStatus");

-- CreateIndex
CREATE INDEX "community_interactions_creatorProfileId_priority_idx" ON "community_interactions"("creatorProfileId", "priority");

-- AddForeignKey
ALTER TABLE "saved_replies" ADD CONSTRAINT "saved_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_scores" ADD CONSTRAINT "comment_scores_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_voice_profiles" ADD CONSTRAINT "user_voice_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
