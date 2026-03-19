-- CreateEnum
CREATE TYPE "UsageTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "usage_budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "UsageTier" NOT NULL DEFAULT 'FREE',
    "dailyTokenLimit" INTEGER NOT NULL DEFAULT 50000,
    "tokensUsedToday" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "tokensUsed" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_rate_limits" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestsRemaining" INTEGER NOT NULL DEFAULT 100,
    "windowResetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listeningFrequency" INTEGER NOT NULL DEFAULT 1,
    "competitiveFrequency" INTEGER NOT NULL DEFAULT 1,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_budgets_userId_key" ON "usage_budgets"("userId");

-- CreateIndex
CREATE INDEX "agent_usage_logs_userId_date_idx" ON "agent_usage_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "agent_usage_logs_userId_agentType_idx" ON "agent_usage_logs"("userId", "agentType");

-- CreateIndex
CREATE UNIQUE INDEX "platform_rate_limits_platform_endpoint_key" ON "platform_rate_limits"("platform", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "media_folders_userId_idx" ON "media_folders"("userId");

-- CreateIndex
CREATE INDEX "media_assets_userId_idx" ON "media_assets"("userId");

-- CreateIndex
CREATE INDEX "media_assets_userId_folderId_idx" ON "media_assets"("userId", "folderId");

-- AddForeignKey
ALTER TABLE "usage_budgets" ADD CONSTRAINT "usage_budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
