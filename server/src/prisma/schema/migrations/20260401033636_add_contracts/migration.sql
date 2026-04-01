-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "brandDealId" TEXT,
    "title" TEXT NOT NULL,
    "terms" TEXT,
    "deliverables" JSONB NOT NULL DEFAULT '[]',
    "paymentSchedule" JSONB NOT NULL DEFAULT '[]',
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_creatorProfileId_status_idx" ON "contracts"("creatorProfileId", "status");

-- CreateIndex
CREATE INDEX "contracts_brandDealId_idx" ON "contracts"("brandDealId");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_brandDealId_fkey" FOREIGN KEY ("brandDealId") REFERENCES "brand_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
