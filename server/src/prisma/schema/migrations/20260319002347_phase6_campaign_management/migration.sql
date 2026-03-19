-- CreateEnum
CREATE TYPE "CampaignStage" AS ENUM ('BRIEF', 'RECRUITING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('POST', 'STORY', 'REEL', 'VIDEO', 'REVIEW', 'UNBOXING', 'TUTORIAL', 'OTHER');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "briefUrl" TEXT,
ADD COLUMN     "kpis" JSONB,
ADD COLUMN     "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stage" "CampaignStage" NOT NULL DEFAULT 'BRIEF',
ADD COLUMN     "timeline" JSONB;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "averageResponseTime" DOUBLE PRECISION,
ADD COLUMN     "mediaKit" JSONB,
ADD COLUMN     "reliabilityScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "campaign_deliverables" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" "Platform",
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "contentUrl" TEXT,
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "payment" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_reports" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "roi" DOUBLE PRECISION,
    "summary" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_deliverables_campaignId_status_idx" ON "campaign_deliverables"("campaignId", "status");

-- CreateIndex
CREATE INDEX "campaign_deliverables_creatorProfileId_idx" ON "campaign_deliverables"("creatorProfileId");

-- CreateIndex
CREATE INDEX "campaign_reports_campaignId_idx" ON "campaign_reports"("campaignId");

-- CreateIndex
CREATE INDEX "campaigns_stage_idx" ON "campaigns"("stage");

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
