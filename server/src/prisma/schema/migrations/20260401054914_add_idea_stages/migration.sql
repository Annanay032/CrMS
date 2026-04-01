-- AlterTable
ALTER TABLE "content_ideas" ADD COLUMN     "stageId" TEXT;

-- CreateTable
CREATE TABLE "idea_stages" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idea_stages_creatorProfileId_position_idx" ON "idea_stages"("creatorProfileId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "idea_stages_creatorProfileId_name_key" ON "idea_stages"("creatorProfileId", "name");

-- CreateIndex
CREATE INDEX "content_ideas_creatorProfileId_stageId_idx" ON "content_ideas"("creatorProfileId", "stageId");

-- AddForeignKey
ALTER TABLE "idea_stages" ADD CONSTRAINT "idea_stages_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "idea_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
