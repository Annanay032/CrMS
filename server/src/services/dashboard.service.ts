import { prisma } from '../config/index.js';

export async function getDashboardStats(userId: string, role: string) {
  if (role === 'CREATOR') {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
      include: { platformStats: true },
    });
    if (!profile) return null;

    const totalFollowers = profile.platformStats.reduce((s, p) => s + p.followers, 0);
    const avgEngagement = profile.platformStats.length > 0
      ? profile.platformStats.reduce((s, p) => s + p.engagementRate, 0) / profile.platformStats.length
      : 0;

    const [scheduledPosts, activeCampaigns, recentPosts, pendingInteractions] = await Promise.all([
      prisma.contentPost.count({ where: { creatorProfileId: profile.id, status: 'SCHEDULED' } }),
      prisma.campaignMatch.count({ where: { creatorProfileId: profile.id, status: 'ACCEPTED' } }),
      prisma.contentPost.findMany({
        where: { creatorProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { analytics: true },
      }),
      prisma.communityInteraction.count({ where: { creatorProfileId: profile.id, respondedAt: null } }),
    ]);

    // Growth data (last 14 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const snapshots = await prisma.creatorAnalyticsSnapshot.findMany({
      where: { creatorProfileId: profile.id, date: { gte: twoWeeksAgo } },
      orderBy: { date: 'asc' },
    });

    const growthRate = snapshots.length >= 2
      ? ((snapshots[snapshots.length - 1].totalFollowers - snapshots[0].totalFollowers) / Math.max(snapshots[0].totalFollowers, 1)) * 100
      : 0;

    return {
      totalFollowers,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      scheduledPosts,
      activeCampaigns,
      pendingInteractions,
      growthRate: Math.round(growthRate * 100) / 100,
      recentPosts,
      platformStats: profile.platformStats,
      snapshots,
    };
  }

  if (role === 'BRAND') {
    const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } });
    if (!brandProfile) return null;

    const [activeCampaigns, totalCampaigns, totalMatches, recentCampaigns] = await Promise.all([
      prisma.campaign.count({ where: { brandProfileId: brandProfile.id, status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { brandProfileId: brandProfile.id } }),
      prisma.campaignMatch.count({
        where: { campaign: { brandProfileId: brandProfile.id } },
      }),
      prisma.campaign.findMany({
        where: { brandProfileId: brandProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { matches: true } } },
      }),
    ]);

    const acceptedMatches = await prisma.campaignMatch.count({
      where: { campaign: { brandProfileId: brandProfile.id }, status: 'ACCEPTED' },
    });

    const avgMatchScore = await prisma.campaignMatch.aggregate({
      where: { campaign: { brandProfileId: brandProfile.id } },
      _avg: { matchScore: true },
    });

    return {
      activeCampaigns,
      totalCampaigns,
      totalMatches,
      acceptedMatches,
      avgMatchScore: Math.round((avgMatchScore._avg.matchScore ?? 0) * 100) / 100,
      recentCampaigns,
    };
  }

  return null;
}

export async function getAnalyticsDashboard(creatorProfileId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'week') {
  const daysBack = period === 'year' ? 365 : period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
  const since = new Date(Date.now() - daysBack * 86_400_000);

  const [posts, snapshots, platformStats, audienceInsights] = await Promise.all([
    prisma.contentPost.findMany({
      where: { creatorProfileId, status: 'PUBLISHED', publishedAt: { gte: since } },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.creatorAnalyticsSnapshot.findMany({
      where: { creatorProfileId, date: { gte: since } },
      orderBy: { date: 'asc' },
    }),
    prisma.creatorPlatformStats.findMany({ where: { creatorProfileId } }),
    prisma.audienceInsight.findMany({
      where: { creatorProfileId, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ]);

  const postsCount = posts.length;
  const totalImpressions = posts.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0);
  const totalReach = posts.reduce((s, p) => s + (p.analytics?.reach ?? 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0);
  const avgEngagementRate = postsCount > 0
    ? posts.reduce((s, p) => {
        const a = p.analytics;
        if (!a || !a.reach) return s;
        return s + ((a.likes + a.comments + a.shares) / a.reach) * 100;
      }, 0) / postsCount
    : 0;

  const followerGrowth = snapshots.length >= 2
    ? snapshots[snapshots.length - 1].totalFollowers - snapshots[0].totalFollowers
    : 0;

  return {
    postsCount,
    totalImpressions,
    totalReach,
    totalLikes,
    totalComments,
    totalShares,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    followerGrowth,
    platformBreakdown: platformStats.map((s) => ({
      platform: s.platform,
      followers: s.followers,
      engagementRate: s.engagementRate,
      avgLikes: s.avgLikes,
      avgComments: s.avgComments,
    })),
    snapshots: snapshots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      totalFollowers: s.totalFollowers,
      totalEngagement: s.totalEngagement,
      growthRate: s.growthRate,
    })),
    topPosts: posts
      .sort((a, b) =>
        ((b.analytics?.likes ?? 0) + (b.analytics?.comments ?? 0)) -
        ((a.analytics?.likes ?? 0) + (a.analytics?.comments ?? 0)),
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        platform: p.platform,
        postType: p.postType,
        caption: p.caption?.slice(0, 60),
        publishedAt: p.publishedAt,
        analytics: p.analytics,
      })),
    contentTypeBreakdown: (() => {
      const byType: Record<string, { count: number; totalEngagement: number; totalReach: number }> = {};
      for (const p of posts) {
        const a = p.analytics;
        const eng = (a?.likes ?? 0) + (a?.comments ?? 0) + (a?.shares ?? 0);
        if (!byType[p.postType]) byType[p.postType] = { count: 0, totalEngagement: 0, totalReach: 0 };
        byType[p.postType].count++;
        byType[p.postType].totalEngagement += eng;
        byType[p.postType].totalReach += a?.reach ?? 0;
      }
      return Object.entries(byType).map(([type, data]) => ({
        type,
        count: data.count,
        totalEngagement: data.totalEngagement,
        totalReach: data.totalReach,
        avgEngRate: data.totalReach > 0 ? Math.round((data.totalEngagement / data.totalReach) * 10000) / 100 : 0,
      }));
    })(),
    audienceInsights: audienceInsights.map((a) => ({
      platform: a.platform,
      date: a.date.toISOString().split('T')[0],
      demographics: a.demographics,
      activeHours: a.activeHours,
      topCountries: a.topCountries,
      interests: a.interests,
    })),
  };
}
