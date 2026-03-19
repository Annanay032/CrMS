import { prisma } from '../config/index.js';

// ─── Page CRUD ──────────────────────────────────────────────

export async function createPage(userId: string, data: {
  slug: string;
  title: string;
  bio?: string;
  avatarUrl?: string;
  theme?: string;
  blocks?: unknown;
  customCSS?: string;
  favicon?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  return prisma.startPage.create({
    data: {
      userId,
      slug: data.slug,
      title: data.title,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      theme: data.theme ?? 'default',
      blocks: (data.blocks as any) ?? [],
      customCSS: data.customCSS,
      favicon: data.favicon,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
    },
    include: { links: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function getPagesByUser(userId: string) {
  return prisma.startPage.findMany({
    where: { userId },
    include: { links: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPageById(id: string) {
  return prisma.startPage.findUnique({
    where: { id },
    include: {
      links: { orderBy: { sortOrder: 'asc' } },
      user: { select: { name: true, avatarUrl: true } },
    },
  });
}

export async function getPageBySlug(slug: string) {
  return prisma.startPage.findUnique({
    where: { slug },
    include: {
      links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      user: { select: { name: true, avatarUrl: true } },
    },
  });
}

export async function updatePage(id: string, userId: string, data: Record<string, unknown>) {
  // Only allow owner to update
  const page = await prisma.startPage.findFirst({ where: { id, userId } });
  if (!page) throw new Error('Page not found');

  const allowed = ['title', 'bio', 'avatarUrl', 'theme', 'blocks', 'customCSS', 'favicon', 'published', 'seoTitle', 'seoDescription', 'slug'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) update[key] = data[key];
  }

  return prisma.startPage.update({
    where: { id },
    data: update as any,
    include: { links: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function deletePage(id: string, userId: string) {
  const page = await prisma.startPage.findFirst({ where: { id, userId } });
  if (!page) throw new Error('Page not found');
  return prisma.startPage.delete({ where: { id } });
}

// ─── Links CRUD ─────────────────────────────────────────────

export async function addLink(pageId: string, userId: string, data: {
  title: string;
  url: string;
  icon?: string;
  thumbnail?: string;
  sortOrder?: number;
}) {
  // Verify ownership
  const page = await prisma.startPage.findFirst({ where: { id: pageId, userId } });
  if (!page) throw new Error('Page not found');

  const maxOrder = await prisma.startPageLink.aggregate({
    where: { pageId },
    _max: { sortOrder: true },
  });

  return prisma.startPageLink.create({
    data: {
      pageId,
      title: data.title,
      url: data.url,
      icon: data.icon,
      thumbnail: data.thumbnail,
      sortOrder: data.sortOrder ?? ((maxOrder._max.sortOrder ?? 0) + 1),
    },
  });
}

export async function updateLink(linkId: string, userId: string, data: Record<string, unknown>) {
  const link = await prisma.startPageLink.findUnique({
    where: { id: linkId },
    include: { page: { select: { userId: true } } },
  });
  if (!link || link.page.userId !== userId) throw new Error('Link not found');

  const allowed = ['title', 'url', 'icon', 'thumbnail', 'sortOrder', 'isActive'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) update[key] = data[key];
  }

  return prisma.startPageLink.update({
    where: { id: linkId },
    data: update as any,
  });
}

export async function deleteLink(linkId: string, userId: string) {
  const link = await prisma.startPageLink.findUnique({
    where: { id: linkId },
    include: { page: { select: { userId: true } } },
  });
  if (!link || link.page.userId !== userId) throw new Error('Link not found');

  return prisma.startPageLink.delete({ where: { id: linkId } });
}

export async function reorderLinks(pageId: string, userId: string, linkIds: string[]) {
  const page = await prisma.startPage.findFirst({ where: { id: pageId, userId } });
  if (!page) throw new Error('Page not found');

  const updates = linkIds.map((id, index) =>
    prisma.startPageLink.update({ where: { id }, data: { sortOrder: index } }),
  );
  await prisma.$transaction(updates);
  return prisma.startPageLink.findMany({ where: { pageId }, orderBy: { sortOrder: 'asc' } });
}

// ─── Click Tracking & Analytics ──────────────────────────────

export async function trackClick(linkId: string, pageId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.startPageLink.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    }),
    prisma.startPageAnalytics.upsert({
      where: { pageId_date: { pageId, date: today } },
      create: { pageId, date: today, clicks: 1 },
      update: { clicks: { increment: 1 } },
    }),
  ]);
}

export async function trackView(pageId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.startPageAnalytics.upsert({
    where: { pageId_date: { pageId, date: today } },
    create: { pageId, date: today, views: 1 },
    update: { views: { increment: 1 } },
  });
}

export async function getAnalytics(pageId: string, userId: string, days = 30) {
  const page = await prisma.startPage.findFirst({ where: { id: pageId, userId } });
  if (!page) throw new Error('Page not found');

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const analytics = await prisma.startPageAnalytics.findMany({
    where: { pageId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  const links = await prisma.startPageLink.findMany({
    where: { pageId },
    orderBy: { clicks: 'desc' },
  });

  const totalViews = analytics.reduce((s, a) => s + a.views, 0);
  const totalClicks = analytics.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  return {
    totalViews,
    totalClicks,
    ctr: parseFloat(ctr),
    daily: analytics.map((a) => ({ date: a.date, views: a.views, clicks: a.clicks })),
    topLinks: links.slice(0, 10).map((l) => ({ id: l.id, title: l.title, clicks: l.clicks })),
  };
}

export async function checkSlugAvailable(slug: string, excludePageId?: string) {
  const existing = await prisma.startPage.findUnique({ where: { slug } });
  if (!existing) return true;
  return excludePageId ? existing.id === excludePageId : false;
}
