-- CreateEnum
CREATE TYPE "MentionSentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED');

-- CreateTable
CREATE TABLE "listening_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "platforms" "Platform"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "source" TEXT,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "sentiment" "MentionSentiment" NOT NULL DEFAULT 'NEUTRAL',
    "reach" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_snapshots" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "mixedCount" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sentiment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handles" JSONB NOT NULL,
    "platforms" "Platform"[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_snapshots" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "Platform" NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topContentTypes" TEXT[],
    "topHashtags" TEXT[],
    "avgLikes" INTEGER NOT NULL DEFAULT 0,
    "avgComments" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "competitor_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listening_queries_userId_isActive_idx" ON "listening_queries"("userId", "isActive");

-- CreateIndex
CREATE INDEX "mentions_queryId_sentiment_idx" ON "mentions"("queryId", "sentiment");

-- CreateIndex
CREATE INDEX "mentions_queryId_platform_idx" ON "mentions"("queryId", "platform");

-- CreateIndex
CREATE INDEX "mentions_detectedAt_idx" ON "mentions"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_snapshots_queryId_date_key" ON "sentiment_snapshots"("queryId", "date");

-- CreateIndex
CREATE INDEX "competitors_userId_isActive_idx" ON "competitors"("userId", "isActive");

-- CreateIndex
CREATE INDEX "competitor_snapshots_competitorId_platform_idx" ON "competitor_snapshots"("competitorId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_snapshots_competitorId_date_platform_key" ON "competitor_snapshots"("competitorId", "date", "platform");

-- AddForeignKey
ALTER TABLE "listening_queries" ADD CONSTRAINT "listening_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "listening_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_snapshots" ADD CONSTRAINT "sentiment_snapshots_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "listening_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_snapshots" ADD CONSTRAINT "competitor_snapshots_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
