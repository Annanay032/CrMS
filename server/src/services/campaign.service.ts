import { prisma } from '../config/index.js';
import type { CampaignStatus, Platform } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

export async function createCampaign(brandProfileId: string, data: {
  title: string;
  description?: string;
  budget?: number;
  targetNiche: string[];
  targetPlatforms: Platform[];
  startDate?: Date;
  endDate?: Date;
  criteria?: {
    nicheWeight?: number;
    engagementWeight?: number;
    followerWeight?: number;
    locationWeight?: number;
    budgetWeight?: number;
    languageWeight?: number;
  };
}) {
  const { criteria, ...campaignData } = data;
  return prisma.campaign.create({
    data: {
      brandProfileId,
      ...campaignData,
      criteria: criteria ? { create: criteria } : undefined,
    },
    include: { criteria: true, matches: true },
  });
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      criteria: true,
      matches: {
        include: {
          creatorProfile: {
            include: { user: { select: { name: true, avatarUrl: true } }, platformStats: true },
          },
        },
        orderBy: { matchScore: 'desc' },
      },
      brandProfile: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function listCampaigns(page: number, limit: number, filters?: {
  brandProfileId?: string;
  status?: CampaignStatus;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = {};
  if (filters?.brandProfileId) where.brandProfileId = filters.brandProfileId;
  if (filters?.status) where.status = filters.status;

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take,
      include: { criteria: true, brandProfile: { include: { user: { select: { name: true } } } }, _count: { select: { matches: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campaign.count({ where }),
  ]);

  return { campaigns, total };
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({ where: { id }, data: { status } });
}

export async function respondToMatch(matchId: string, creatorProfileId: string, accept: boolean) {
  return prisma.campaignMatch.update({
    where: { id: matchId, creatorProfileId },
    data: { status: accept ? 'ACCEPTED' : 'REJECTED' },
  });
}

export async function getCreatorCampaigns(creatorProfileId: string, page: number, limit: number) {
  const { skip, take } = paginate(page, limit);

  const [matches, total] = await Promise.all([
    prisma.campaignMatch.findMany({
      where: { creatorProfileId },
      skip,
      take,
      include: {
        campaign: {
          include: { brandProfile: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { matchScore: 'desc' },
    }),
    prisma.campaignMatch.count({ where: { creatorProfileId } }),
  ]);

  return { matches, total };
}
