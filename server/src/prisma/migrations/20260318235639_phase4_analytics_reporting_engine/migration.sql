-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'FAILED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "post_analytics" ADD COLUMN     "audienceDemographics" JSONB,
ADD COLUMN     "avgWatchTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "boosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contentType" "PostType",
ADD COLUMN     "platform" "Platform",
ADD COLUMN     "profileVisits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoViews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorProfileId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "metrics" TEXT[],
    "platforms" "Platform"[],
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "schedule" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "generatedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audience_insights" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "date" DATE NOT NULL,
    "demographics" JSONB NOT NULL,
    "activeHours" JSONB NOT NULL,
    "topCountries" JSONB NOT NULL,
    "topCities" JSONB NOT NULL,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_reports_userId_status_idx" ON "analytics_reports"("userId", "status");

-- CreateIndex
CREATE INDEX "audience_insights_creatorProfileId_idx" ON "audience_insights"("creatorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "audience_insights_creatorProfileId_platform_date_key" ON "audience_insights"("creatorProfileId", "platform", "date");

-- CreateIndex
CREATE INDEX "post_analytics_platform_idx" ON "post_analytics"("platform");

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_insights" ADD CONSTRAINT "audience_insights_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
