import {
  Platform, CampaignStatus, MatchStatus, DeliverableType, DeliverableStatus,
} from '@prisma/client';
import { SeedContext, daysAgo, futureDate } from './context.js';

export async function seedCampaigns(ctx: SeedContext) {
  const { prisma, profiles } = ctx;
  const { cp1, cp2, cp3, bp1, bp2 } = profiles;

  // ── Campaigns ─────────────────────────────────────────────
  const campaign1 = await prisma.campaign.create({
    data: {
      brandProfileId: bp1.id,
      title: 'Summer Fitness Challenge 2026',
      description: 'Looking for fitness creators to promote our new summer activewear collection with workout videos and lifestyle content.',
      budget: 5000, targetNiche: ['fitness', 'wellness'], targetPlatforms: [Platform.INSTAGRAM, Platform.TIKTOK],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(10), endDate: futureDate(50),
      criteria: { create: { nicheWeight: 0.3, engagementWeight: 0.25, followerWeight: 0.15, locationWeight: 0.1, budgetWeight: 0.1, languageWeight: 0.1 } },
    },
  });

  await prisma.campaign.create({
    data: {
      brandProfileId: bp1.id,
      title: 'Protein Launch Campaign',
      description: 'New plant-based protein powder launch — need authentic reviews from health & fitness creators.',
      budget: 3000, targetNiche: ['fitness', 'food', 'wellness'], targetPlatforms: [Platform.YOUTUBE, Platform.INSTAGRAM],
      status: CampaignStatus.DRAFT, startDate: futureDate(14), endDate: futureDate(60),
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      brandProfileId: bp2.id,
      title: 'Nova Headphones Tech Review',
      description: 'Seeking tech reviewers for our new noise-cancelling headphones. Honest reviews encouraged!',
      budget: 8000, targetNiche: ['tech', 'gaming'], targetPlatforms: [Platform.YOUTUBE, Platform.TIKTOK],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(5), endDate: futureDate(30),
      criteria: { create: { nicheWeight: 0.35, engagementWeight: 0.25, followerWeight: 0.2, locationWeight: 0.05, budgetWeight: 0.05, languageWeight: 0.1 } },
    },
  });

  const campaign4 = await prisma.campaign.create({
    data: {
      brandProfileId: bp2.id,
      title: 'Back-to-School Tech Essentials',
      description: 'College tech essentials campaign targeting student audiences.',
      budget: 12000, targetNiche: ['tech', 'education'], targetPlatforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(2), endDate: futureDate(45),
    },
  });
  console.log('Campaigns seeded ✓');

  // ── Campaign Matches ──────────────────────────────────────
  await Promise.all([
    prisma.campaignMatch.create({
      data: { campaignId: campaign1.id, creatorProfileId: cp1.id, matchScore: 92, scoreBreakdown: { niche: 0.95, engagement: 0.88, followers: 0.85, location: 0.9, language: 0.95 }, status: MatchStatus.ACCEPTED },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign1.id, creatorProfileId: cp3.id, matchScore: 68, scoreBreakdown: { niche: 0.5, engagement: 0.92, followers: 0.88, location: 0.7, language: 0.85 }, status: MatchStatus.PENDING },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign3.id, creatorProfileId: cp2.id, matchScore: 95, scoreBreakdown: { niche: 0.98, engagement: 0.9, followers: 0.92, location: 0.95, language: 1.0 }, status: MatchStatus.ACCEPTED },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign4.id, creatorProfileId: cp2.id, matchScore: 88, scoreBreakdown: { niche: 0.9, engagement: 0.85, followers: 0.92, location: 0.85, language: 1.0 }, status: MatchStatus.PENDING },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign3.id, creatorProfileId: cp1.id, matchScore: 45, scoreBreakdown: { niche: 0.2, engagement: 0.88, followers: 0.4, location: 0.9, language: 0.95 }, status: MatchStatus.REJECTED },
    }),
  ]);
  console.log('Campaign matches seeded ✓');

  // ── Campaign Deliverables ─────────────────────────────────
  await prisma.campaignDeliverable.createMany({
    data: [
      {
        campaignId: campaign1.id, creatorProfileId: cp1.id,
        type: DeliverableType.REEL, title: 'Summer workout reel', description: 'Quick activewear showcase workout reel for Instagram.',
        platform: Platform.INSTAGRAM, status: DeliverableStatus.APPROVED,
        dueDate: futureDate(10), submittedAt: daysAgo(2), approvedAt: daysAgo(1), payment: 800,
      },
      {
        campaignId: campaign1.id, creatorProfileId: cp3.id,
        type: DeliverableType.POST, title: 'Lifestyle activewear post', description: 'Lifestyle photo with activewear and wellness caption.',
        platform: Platform.INSTAGRAM, status: DeliverableStatus.PENDING,
        dueDate: futureDate(20), payment: 500,
      },
      {
        campaignId: campaign3.id, creatorProfileId: cp2.id,
        type: DeliverableType.VIDEO, title: 'Nova Headphones full review', description: 'In-depth review video with sound test comparison.',
        platform: Platform.YOUTUBE, status: DeliverableStatus.IN_PROGRESS,
        dueDate: futureDate(15), payment: 1500,
      },
      {
        campaignId: campaign3.id, creatorProfileId: cp2.id,
        type: DeliverableType.REEL, title: 'Quick ANC demo short', description: '60-second noise cancelling demo for TikTok.',
        platform: Platform.TIKTOK, status: DeliverableStatus.SUBMITTED,
        dueDate: futureDate(12), submittedAt: daysAgo(1), payment: 600,
      },
    ],
  });
  console.log('Campaign deliverables seeded ✓');

  // ── Campaign Reports ──────────────────────────────────────
  await prisma.campaignReport.createMany({
    data: [
      {
        campaignId: campaign1.id, title: 'Mid-campaign performance',
        metrics: { impressions: 320000, reach: 240000, engagement: 18500, clicks: 4200, conversions: 120 },
        roi: 3.2, summary: 'Campaign is tracking above target KPIs. Jane\'s content driving 68% of all engagement.',
      },
      {
        campaignId: campaign3.id, title: 'Week 1 results',
        metrics: { impressions: 295000, reach: 232000, engagement: 27400, clicks: 1300, conversions: 85 },
        roi: 2.8, summary: 'Strong initial performance from Alex\'s tech review content. TikTok outperforming YouTube on reach.',
      },
    ],
  });
  console.log('Campaign reports seeded ✓');
}
