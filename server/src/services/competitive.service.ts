import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';

export async function createCompetitor(userId: string, data: { name: string; handles: Record<string, string>; platforms: string[]; notes?: string }) {
  return prisma.competitor.create({
    data: {
      userId,
      name: data.name,
      handles: data.handles,
      platforms: data.platforms as any[],
      notes: data.notes,
    },
  });
}

export async function getCompetitors(userId: string, page = 1) {
  const { skip, take, page: safePage, limit } = paginate(page);
  const [competitors, total] = await Promise.all([
    prisma.competitor.findMany({
      where: { userId, isActive: true },
      include: {
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        _count: { select: { snapshots: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.competitor.count({ where: { userId, isActive: true } }),
  ]);
  return { competitors, total, page: safePage, limit };
}

export async function getCompetitorById(competitorId: string, userId: string) {
  return prisma.competitor.findFirst({
    where: { id: competitorId, userId },
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });
}

export async function updateCompetitor(competitorId: string, userId: string, data: { name?: string; handles?: Record<string, string>; platforms?: string[]; notes?: string; isActive?: boolean }) {
  return prisma.competitor.update({
    where: { id: competitorId, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.handles !== undefined && { handles: data.handles }),
      ...(data.platforms !== undefined && { platforms: data.platforms as any[] }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deleteCompetitor(competitorId: string, userId: string) {
  return prisma.competitor.delete({
    where: { id: competitorId, userId },
  });
}

export async function getCompetitorSnapshots(competitorId: string, userId: string, platform?: string, days = 30) {
  const comp = await prisma.competitor.findFirst({ where: { id: competitorId, userId } });
  if (!comp) throw new Error('Competitor not found');

  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.competitorSnapshot.findMany({
    where: {
      competitorId,
      date: { gte: since },
      ...(platform && { platform: platform as any }),
    },
    orderBy: { date: 'asc' },
  });
}

export async function upsertSnapshot(data: {
  competitorId: string;
  platform: string;
  followers: number;
  engagementRate: number;
  postFrequency: number;
  topContentTypes: string[];
  topHashtags: string[];
  avgLikes: number;
  avgComments: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.competitorSnapshot.upsert({
    where: {
      competitorId_date_platform: {
        competitorId: data.competitorId,
        date: today,
        platform: data.platform as any,
      },
    },
    create: {
      competitorId: data.competitorId,
      date: today,
      platform: data.platform as any,
      followers: data.followers,
      engagementRate: data.engagementRate,
      postFrequency: data.postFrequency,
      topContentTypes: data.topContentTypes,
      topHashtags: data.topHashtags,
      avgLikes: data.avgLikes,
      avgComments: data.avgComments,
    },
    update: {
      followers: data.followers,
      engagementRate: data.engagementRate,
      postFrequency: data.postFrequency,
      topContentTypes: data.topContentTypes,
      topHashtags: data.topHashtags,
      avgLikes: data.avgLikes,
      avgComments: data.avgComments,
    },
  });
}

export async function getBenchmarkData(userId: string, platform: string) {
  const competitors = await prisma.competitor.findMany({
    where: { userId, isActive: true, platforms: { has: platform as any } },
    include: {
      snapshots: {
        where: { platform: platform as any },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  return competitors.map((c) => ({
    id: c.id,
    name: c.name,
    handles: c.handles as Record<string, string>,
    latestSnapshot: c.snapshots[0] ?? null,
  }));
}
