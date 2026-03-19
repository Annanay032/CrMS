-- CreateTable
CREATE TABLE "start_pages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "customCSS" TEXT,
    "favicon" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "start_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "start_page_links" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "thumbnail" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "start_page_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "start_page_analytics" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "topLinks" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "start_page_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "start_pages_slug_key" ON "start_pages"("slug");

-- CreateIndex
CREATE INDEX "start_pages_userId_idx" ON "start_pages"("userId");

-- CreateIndex
CREATE INDEX "start_page_links_pageId_idx" ON "start_page_links"("pageId");

-- CreateIndex
CREATE INDEX "start_page_analytics_pageId_date_idx" ON "start_page_analytics"("pageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "start_page_analytics_pageId_date_key" ON "start_page_analytics"("pageId", "date");

-- AddForeignKey
ALTER TABLE "start_pages" ADD CONSTRAINT "start_pages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_page_links" ADD CONSTRAINT "start_page_links_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "start_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_page_analytics" ADD CONSTRAINT "start_page_analytics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "start_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
