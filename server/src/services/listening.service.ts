import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';

export async function createQuery(userId: string, data: { name: string; keywords: string[]; platforms: string[] }) {
  return prisma.listeningQuery.create({
    data: {
      userId,
      name: data.name,
      keywords: data.keywords,
      platforms: data.platforms as any[],
    },
  });
}

export async function getQueries(userId: string, page = 1) {
  const { skip, take, page: safePage, limit } = paginate(page);
  const [queries, total] = await Promise.all([
    prisma.listeningQuery.findMany({
      where: { userId },
      include: {
        _count: { select: { mentions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.listeningQuery.count({ where: { userId } }),
  ]);
  return { queries, total, page: safePage, limit };
}

export async function getQueryById(queryId: string, userId: string) {
  return prisma.listeningQuery.findFirst({
    where: { id: queryId, userId },
    include: {
      _count: { select: { mentions: true } },
    },
  });
}

export async function updateQuery(queryId: string, userId: string, data: { name?: string; keywords?: string[]; platforms?: string[]; isActive?: boolean }) {
  return prisma.listeningQuery.update({
    where: { id: queryId, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.keywords !== undefined && { keywords: data.keywords }),
      ...(data.platforms !== undefined && { platforms: data.platforms as any[] }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deleteQuery(queryId: string, userId: string) {
  return prisma.listeningQuery.delete({
    where: { id: queryId, userId },
  });
}

export async function getMentions(queryId: string, userId: string, filters: { platform?: string; sentiment?: string; page?: number }) {
  // Verify ownership
  const query = await prisma.listeningQuery.findFirst({ where: { id: queryId, userId } });
  if (!query) throw new Error('Query not found');

  const { skip, take, page, limit } = paginate(filters.page);
  const where: Record<string, unknown> = { queryId };
  if (filters.platform) where.platform = filters.platform;
  if (filters.sentiment) where.sentiment = filters.sentiment;

  const [mentions, total] = await Promise.all([
    prisma.mention.findMany({
      where: where as any,
      orderBy: { detectedAt: 'desc' },
      skip,
      take,
    }),
    prisma.mention.count({ where: where as any }),
  ]);

  return { mentions, total, page, limit };
}

export async function getSentimentTimeline(queryId: string, userId: string, days = 30) {
  const query = await prisma.listeningQuery.findFirst({ where: { id: queryId, userId } });
  if (!query) throw new Error('Query not found');

  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.sentimentSnapshot.findMany({
    where: { queryId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
}

export async function getSentimentSummary(queryId: string, userId: string) {
  const query = await prisma.listeningQuery.findFirst({ where: { id: queryId, userId } });
  if (!query) throw new Error('Query not found');

  const [totals, recentMentions] = await Promise.all([
    prisma.mention.groupBy({
      by: ['sentiment'],
      where: { queryId },
      _count: { id: true },
    }),
    prisma.mention.count({
      where: {
        queryId,
        detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const sentimentCounts: Record<string, number> = {};
  let total = 0;
  for (const row of totals) {
    sentimentCounts[row.sentiment] = row._count.id;
    total += row._count.id;
  }

  return { sentimentCounts, totalMentions: total, last24h: recentMentions };
}

export async function ingestMention(data: { queryId: string; platform: string; source?: string; content: string; url?: string; sentiment: string; reach?: number }) {
  return prisma.mention.create({
    data: {
      queryId: data.queryId,
      platform: data.platform as any,
      source: data.source,
      content: data.content,
      url: data.url,
      sentiment: data.sentiment as any,
      reach: data.reach ?? 0,
    },
  });
}

export async function upsertSentimentSnapshot(queryId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = await prisma.mention.groupBy({
    by: ['sentiment'],
    where: {
      queryId,
      detectedAt: { gte: today },
    },
    _count: { id: true },
  });

  const data: Record<string, number> = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 };
  for (const row of counts) {
    data[row.sentiment] = row._count.id;
  }

  return prisma.sentimentSnapshot.upsert({
    where: { queryId_date: { queryId, date: today } },
    create: {
      queryId,
      date: today,
      positiveCount: data.POSITIVE,
      negativeCount: data.NEGATIVE,
      neutralCount: data.NEUTRAL,
      mixedCount: data.MIXED,
      totalVolume: data.POSITIVE + data.NEGATIVE + data.NEUTRAL + data.MIXED,
    },
    update: {
      positiveCount: data.POSITIVE,
      negativeCount: data.NEGATIVE,
      neutralCount: data.NEUTRAL,
      mixedCount: data.MIXED,
      totalVolume: data.POSITIVE + data.NEGATIVE + data.NEUTRAL + data.MIXED,
    },
  });
}
