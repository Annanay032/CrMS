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
