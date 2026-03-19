import { prisma } from '../config/index.js';
import type { InteractionType, Platform, Sentiment } from '../types/enums.js';
import type { CaseStatus } from '@prisma/client';
import { paginate } from '../utils/helpers.js';

/* ── Inbox / Interactions ──────────────────────────────── */

export async function getInteractions(creatorProfileId: string, page: number, limit: number, filters?: {
  platform?: Platform;
  interactionType?: InteractionType;
  sentiment?: Sentiment;
  responded?: boolean;
  isRead?: boolean;
  caseStatus?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'priority';
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };

  if (filters?.platform) where.platform = filters.platform;
  if (filters?.interactionType) where.interactionType = filters.interactionType;
  if (filters?.sentiment) where.sentiment = filters.sentiment;
  if (filters?.responded === true) where.respondedAt = { not: null };
  if (filters?.responded === false) where.respondedAt = null;
  if (filters?.isRead !== undefined) where.isRead = filters.isRead;
  if (filters?.caseStatus) where.caseStatus = filters.caseStatus;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters?.search) where.content = { contains: filters.search, mode: 'insensitive' };

  let orderBy: Record<string, string>;
  switch (filters?.sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'priority':
      orderBy = { priority: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [interactions, total] = await Promise.all([
    prisma.communityInteraction.findMany({
      where,
      skip,
      take,
      orderBy,
    }),
    prisma.communityInteraction.count({ where }),
  ]);

  return { interactions, total };
}

export async function getInteractionById(interactionId: string, creatorProfileId: string) {
  return prisma.communityInteraction.findFirst({
    where: { id: interactionId, creatorProfileId },
  });
}

export async function markResponded(interactionId: string, creatorProfileId: string) {
  return prisma.communityInteraction.update({
    where: { id: interactionId, creatorProfileId },
    data: { respondedAt: new Date(), caseStatus: 'RESOLVED' as CaseStatus },
  });
}

export async function markRead(interactionId: string, creatorProfileId: string) {
  return prisma.communityInteraction.update({
    where: { id: interactionId, creatorProfileId },
    data: { isRead: true },
  });
}

export async function markBulkRead(interactionIds: string[], creatorProfileId: string) {
  return prisma.communityInteraction.updateMany({
    where: { id: { in: interactionIds }, creatorProfileId },
    data: { isRead: true },
  });
}

export async function updateCase(interactionId: string, creatorProfileId: string, data: {
  caseStatus?: string;
  priority?: string;
  assignedTo?: string | null;
  tags?: string[];
}) {
  return prisma.communityInteraction.update({
    where: { id: interactionId, creatorProfileId },
    data: {
      ...(data.caseStatus && { caseStatus: data.caseStatus as CaseStatus }),
      ...(data.priority && { priority: data.priority as never }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(data.tags && { tags: data.tags }),
    },
  });
}

export async function assignInteraction(interactionId: string, creatorProfileId: string, assignedTo: string | null) {
  return prisma.communityInteraction.update({
    where: { id: interactionId, creatorProfileId },
    data: { assignedTo, caseStatus: (assignedTo ? 'IN_PROGRESS' : 'OPEN') as CaseStatus },
  });
}

/* ── Stats ─────────────────────────────────────────────── */

export async function getCommunityStats(creatorProfileId: string) {
  const [total, pending, unread, positive, negative, questions, highPriority] = await Promise.all([
    prisma.communityInteraction.count({ where: { creatorProfileId } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, respondedAt: null } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, isRead: false } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'POSITIVE' } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'NEGATIVE' } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'QUESTION' } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, priority: 'HIGH' } }),
  ]);

  return { total, pending, unread, positive, negative, questions, highPriority, responseRate: total > 0 ? Math.round(((total - pending) / total) * 100) : 0 };
}

/* ── Saved Replies ─────────────────────────────────────── */

export async function getSavedReplies(userId: string) {
  return prisma.savedReply.findMany({ where: { userId }, orderBy: { usageCount: 'desc' } });
}

export async function createSavedReply(userId: string, data: { title: string; body: string; tags?: string[]; shortcut?: string }) {
  return prisma.savedReply.create({ data: { ...data, tags: data.tags ?? [], userId } });
}

export async function updateSavedReply(id: string, userId: string, data: { title?: string; body?: string; tags?: string[]; shortcut?: string }) {
  return prisma.savedReply.update({ where: { id, userId }, data });
}

export async function deleteSavedReply(id: string, userId: string) {
  return prisma.savedReply.delete({ where: { id, userId } });
}

export async function incrementSavedReplyUsage(id: string, userId: string) {
  return prisma.savedReply.update({ where: { id, userId }, data: { usageCount: { increment: 1 } } });
}

/* ── Voice Profile ─────────────────────────────────────── */

export async function getVoiceProfile(userId: string) {
  return prisma.userVoiceProfile.findUnique({ where: { userId } });
}

export async function upsertVoiceProfile(userId: string, data: {
  tonePreferences: string[];
  vocabulary: string[];
  exampleReplies?: string[];
}) {
  return prisma.userVoiceProfile.upsert({
    where: { userId },
    create: { userId, ...data, exampleReplies: data.exampleReplies ?? [] },
    update: data,
  });
}

/* ── Threads ──────────────────────────────────────────── */

export async function getThreads(creatorProfileId: string, page: number, limit: number) {
  const { skip, take } = paginate(page, limit);

  // Group interactions by threadId
  const threads = await prisma.communityInteraction.findMany({
    where: { creatorProfileId, threadId: { not: null } },
    distinct: ['threadId'],
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  // For each thread, get the latest message and count
  const enriched = await Promise.all(
    threads.map(async (t) => {
      const [messages, count] = await Promise.all([
        prisma.communityInteraction.findMany({
          where: { creatorProfileId, threadId: t.threadId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }),
        prisma.communityInteraction.count({
          where: { creatorProfileId, threadId: t.threadId },
        }),
      ]);
      return { threadId: t.threadId, latestMessage: messages[0], messageCount: count };
    }),
  );

  return enriched;
}

/* ── Inbox Channels ───────────────────────────────────── */

export async function getChannels(creatorProfileId: string) {
  return prisma.inboxChannel.findMany({ where: { creatorProfileId }, orderBy: { createdAt: 'desc' } });
}

export async function upsertChannel(creatorProfileId: string, data: {
  type: string;
  label?: string;
  config?: unknown;
}) {
  return prisma.inboxChannel.upsert({
    where: { creatorProfileId_type: { creatorProfileId, type: data.type as any } },
    create: { creatorProfileId, type: data.type as any, label: data.label, config: data.config as any },
    update: { label: data.label, config: data.config as any, status: 'CONNECTED' as any },
  });
}

export async function deleteChannel(creatorProfileId: string, type: string) {
  return prisma.inboxChannel.delete({
    where: { creatorProfileId_type: { creatorProfileId, type: type as any } },
  });
}

/* ── Star / Unstar ────────────────────────────────────── */

export async function starInteraction(id: string, star: boolean) {
  return prisma.communityInteraction.update({ where: { id }, data: { isStarred: star } });
}

/* ── Comment Score (Phase 9) ───────────────────────────── */

export async function calculateCommentScore(creatorProfileId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const interactions = await prisma.communityInteraction.findMany({
    where: { creatorProfileId, createdAt: { gte: thirtyDaysAgo } },
    select: { id: true, createdAt: true, respondedAt: true },
  });

  const total = interactions.length;
  if (total === 0) {
    return { responseRate: 0, avgResponseMinutes: 0, consistency: 0, overallScore: 0, total: 0 };
  }

  const responded = interactions.filter((i) => i.respondedAt !== null);
  const responseRate = (responded.length / total) * 100;

  // Avg response time in minutes
  const responseTimes = responded
    .map((i) => (i.respondedAt!.getTime() - i.createdAt.getTime()) / 60_000)
    .filter((t) => t > 0);
  const avgResponseMinutes = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  // Consistency: group replies by day, measure std deviation
  const dailyCounts: Record<string, number> = {};
  for (const i of responded) {
    const day = i.respondedAt!.toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  }
  const counts = Object.values(dailyCounts);
  const mean = counts.reduce((a, b) => a + b, 0) / Math.max(counts.length, 1);
  const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / Math.max(counts.length, 1);
  const stdDev = Math.sqrt(variance);
  // Lower std dev = more consistent. Normalize to 0-100 (cap at 50 stdDev)
  const consistency = Math.max(0, 100 - (stdDev / 50) * 100);

  // Weighted overall score: 40% rate, 30% speed (capped at 60min=100), 30% consistency
  const speedScore = Math.max(0, 100 - (avgResponseMinutes / 60) * 100);
  const overallScore = Math.round(responseRate * 0.4 + speedScore * 0.3 + consistency * 0.3);

  // Persist snapshot
  const period = new Date().toISOString().slice(0, 7); // "2026-03"
  await prisma.commentScore.upsert({
    where: { creatorProfileId_period: { creatorProfileId, period } },
    update: { responseRate, avgResponseTime: avgResponseMinutes, consistency, calculatedAt: new Date() },
    create: { creatorProfileId, period, responseRate, avgResponseTime: avgResponseMinutes, consistency },
  });

  return {
    responseRate: Math.round(responseRate * 10) / 10,
    avgResponseMinutes: Math.round(avgResponseMinutes),
    consistency: Math.round(consistency),
    overallScore,
    total,
  };
}

/* ── Create Post from Reply (Phase 10) ─────────────────── */

export async function createPostFromReply(interactionId: string, creatorProfileId: string) {
  const interaction = await prisma.communityInteraction.findFirst({
    where: { id: interactionId, creatorProfileId },
  });

  if (!interaction) {
    throw Object.assign(new Error('Interaction not found'), { statusCode: 404 });
  }

  // Create a DRAFT post pre-filled with the interaction content
  const caption = interaction.aiSuggestion ?? interaction.content;

  const post = await prisma.contentPost.create({
    data: {
      creatorProfileId,
      platform: interaction.platform,
      postType: 'IMAGE', // default, user can change
      caption: `${caption}\n\n(Inspired by a community interaction)`,
      status: 'DRAFT',
      hashtags: [],
      mediaUrls: [],
    },
  });

  return post;
}
