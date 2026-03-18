import { prisma } from '../config/index.js';
import { orchestrator } from '../agents/orchestrator.js';
import { AgentType } from '../types/enums.js';
import { computeMatchScores } from './scoring.js';

export async function findCreatorsForCampaign(campaignId: string, userId: string) {
  return orchestrator.run(AgentType.MATCHING, userId, { campaignId });
}

export async function getMatchResults(campaignId: string) {
  return prisma.campaignMatch.findMany({
    where: { campaignId },
    include: {
      creatorProfile: {
        include: {
          user: { select: { name: true, avatarUrl: true } },
          platformStats: true,
        },
      },
    },
    orderBy: { matchScore: 'desc' },
  });
}

export async function discoverCreators(filters: {
  niche?: string[];
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    availabilityStatus: 'available',
  };

  if (filters.niche?.length) {
    where.niche = { hasSome: filters.niche };
  }

  if (filters.platform || filters.minFollowers || filters.maxFollowers || filters.minEngagement) {
    const statsWhere: Record<string, unknown> = {};
    if (filters.platform) statsWhere.platform = filters.platform;
    if (filters.minFollowers) statsWhere.followers = { gte: filters.minFollowers };
    if (filters.maxFollowers) {
      statsWhere.followers = { ...(statsWhere.followers as object ?? {}), lte: filters.maxFollowers };
    }
    if (filters.minEngagement) statsWhere.engagementRate = { gte: filters.minEngagement };
    where.platformStats = { some: statsWhere };
  }

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        platformStats: true,
      },
    }),
    prisma.creatorProfile.count({ where }),
  ]);

  return { creators, total, page, limit };
}
