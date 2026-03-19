import { prisma } from '../config/index.js';
import type { CampaignStatus, CampaignStage, DeliverableStatus, DeliverableType, Platform } from '../types/enums.js';
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
      deliverables: {
        include: { creatorProfile: { include: { user: { select: { name: true, avatarUrl: true } } } } },
        orderBy: { dueDate: 'asc' },
      },
      reports: { orderBy: { generatedAt: 'desc' } },
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
      include: { criteria: true, brandProfile: { include: { user: { select: { name: true } } } }, _count: { select: { matches: true, deliverables: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campaign.count({ where }),
  ]);

  return { campaigns, total };
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({ where: { id }, data: { status } });
}

export async function updateCampaignStage(id: string, stage: CampaignStage) {
  const stageStatusMap: Record<string, CampaignStatus> = {
    BRIEF: 'DRAFT' as CampaignStatus,
    RECRUITING: 'ACTIVE' as CampaignStatus,
    IN_PROGRESS: 'ACTIVE' as CampaignStatus,
    REVIEW: 'ACTIVE' as CampaignStatus,
    COMPLETED: 'COMPLETED' as CampaignStatus,
  };

  return prisma.campaign.update({
    where: { id },
    data: { stage, status: stageStatusMap[stage] ?? ('ACTIVE' as CampaignStatus) },
  });
}

export async function updateCampaign(id: string, data: {
  title?: string;
  description?: string;
  budget?: number;
  spent?: number;
  timeline?: unknown;
  kpis?: unknown;
  briefUrl?: string;
}) {
  return prisma.campaign.update({ where: { id }, data: data as any });
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
          include: { brandProfile: { include: { user: { select: { name: true } } } }, _count: { select: { deliverables: true } } },
        },
      },
      orderBy: { matchScore: 'desc' },
    }),
    prisma.campaignMatch.count({ where: { creatorProfileId } }),
  ]);

  return { matches, total };
}

// ─── Deliverable Management ──────────────────────────────────

export async function createDeliverable(campaignId: string, data: {
  creatorProfileId: string;
  type: DeliverableType;
  title: string;
  description?: string;
  platform?: Platform;
  dueDate?: Date;
  payment?: number;
}) {
  return prisma.campaignDeliverable.create({
    data: { campaignId, ...data },
    include: { creatorProfile: { include: { user: { select: { name: true, avatarUrl: true } } } } },
  });
}

export async function updateDeliverable(id: string, data: {
  status?: DeliverableStatus;
  contentUrl?: string;
  feedback?: string;
  submittedAt?: Date;
  approvedAt?: Date;
}) {
  const deliverable = await prisma.campaignDeliverable.update({
    where: { id },
    data,
    include: { campaign: true },
  });

  // Auto-update campaign spent when deliverable is approved
  if (data.status === 'APPROVED' && deliverable.payment) {
    await prisma.campaign.update({
      where: { id: deliverable.campaignId },
      data: { spent: { increment: deliverable.payment } },
    });
  }

  return deliverable;
}

export async function getDeliverables(campaignId: string) {
  return prisma.campaignDeliverable.findMany({
    where: { campaignId },
    include: { creatorProfile: { include: { user: { select: { name: true, avatarUrl: true } } } } },
    orderBy: { dueDate: 'asc' },
  });
}

export async function deleteDeliverable(id: string) {
  return prisma.campaignDeliverable.delete({ where: { id } });
}

// ─── Campaign Reports ────────────────────────────────────────

export async function getCampaignReports(campaignId: string) {
  return prisma.campaignReport.findMany({
    where: { campaignId },
    orderBy: { generatedAt: 'desc' },
  });
}

// ─── Creator Discovery ──────────────────────────────────────

export async function discoverCreators(filters: {
  niche?: string;
  platform?: string;
  minFollowers?: number;
  minEngagement?: number;
  location?: string;
  language?: string;
  page?: number;
  limit?: number;
}) {
  const { skip, take } = paginate(filters.page ?? 1, filters.limit ?? 20);

  const where: Record<string, unknown> = { availabilityStatus: 'available' };
  if (filters.niche) where.niche = { has: filters.niche };
  if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
  if (filters.language) where.languages = { has: filters.language };

  const platformWhere: Record<string, unknown> = {};
  if (filters.platform) platformWhere.platform = filters.platform;
  if (filters.minFollowers) platformWhere.followers = { gte: filters.minFollowers };
  if (filters.minEngagement) platformWhere.engagementRate = { gte: filters.minEngagement };

  if (Object.keys(platformWhere).length > 0) {
    where.platformStats = { some: platformWhere };
  }

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        platformStats: true,
        _count: { select: { campaignMatches: true, contentPosts: true } },
      },
      orderBy: { reliabilityScore: { sort: 'desc', nulls: 'last' } },
    }),
    prisma.creatorProfile.count({ where }),
  ]);

  return { creators, total };
}
