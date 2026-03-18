import { prisma } from '../config/index.js';
import type { InteractionType, Platform, Sentiment } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

export async function getInteractions(creatorProfileId: string, page: number, limit: number, filters?: {
  platform?: Platform;
  interactionType?: InteractionType;
  sentiment?: Sentiment;
  responded?: boolean;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };

  if (filters?.platform) where.platform = filters.platform;
  if (filters?.interactionType) where.interactionType = filters.interactionType;
  if (filters?.sentiment) where.sentiment = filters.sentiment;
  if (filters?.responded === true) where.respondedAt = { not: null };
  if (filters?.responded === false) where.respondedAt = null;

  const [interactions, total] = await Promise.all([
    prisma.communityInteraction.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.communityInteraction.count({ where }),
  ]);

  return { interactions, total };
}

export async function markResponded(interactionId: string, creatorProfileId: string) {
  return prisma.communityInteraction.update({
    where: { id: interactionId, creatorProfileId },
    data: { respondedAt: new Date() },
  });
}

export async function getCommunityStats(creatorProfileId: string) {
  const [total, pending, positive, negative, questions] = await Promise.all([
    prisma.communityInteraction.count({ where: { creatorProfileId } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, respondedAt: null } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'POSITIVE' } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'NEGATIVE' } }),
    prisma.communityInteraction.count({ where: { creatorProfileId, sentiment: 'QUESTION' } }),
  ]);

  return { total, pending, positive, negative, questions, responseRate: total > 0 ? Math.round(((total - pending) / total) * 100) : 0 };
}
