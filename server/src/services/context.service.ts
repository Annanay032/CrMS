import { prisma } from '../config/index.js';

/**
 * Gather comprehensive user context for AI-powered chat.
 * Returns a formatted text summary of the creator's data
 * that gets injected into the LLM system prompt.
 */
export async function gatherUserContext(userId: string): Promise<string> {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      platformStats: true,
      user: { select: { name: true } },
    },
  });

  if (!profile) return 'User has no creator profile set up yet.';

  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const [
    recentPosts,
    scheduledPosts,
    publishedCount,
    activeCampaigns,
    pendingInteractions,
    revenueTotal,
    activeDealValue,
    ideas,
    snapshots,
  ] = await Promise.all([
    prisma.contentPost.findMany({
      where: { creatorProfileId: profile.id, status: 'PUBLISHED', publishedAt: { gte: thirtyDaysAgo } },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
    prisma.contentPost.count({
      where: { creatorProfileId: profile.id, status: 'SCHEDULED' },
    }),
    prisma.contentPost.count({
      where: { creatorProfileId: profile.id, status: 'PUBLISHED' },
    }),
    prisma.campaignMatch.count({
      where: { creatorProfileId: profile.id, status: 'ACCEPTED' },
    }),
    prisma.communityInteraction.count({
      where: { creatorProfileId: profile.id, respondedAt: null },
    }),
    prisma.revenueStream.aggregate({
      where: { creatorProfileId: profile.id },
      _sum: { amount: true },
    }),
    prisma.brandDeal.aggregate({
      where: {
        creatorProfileId: profile.id,
        status: { in: ['LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      _sum: { dealValue: true },
    }),
    prisma.contentIdea.findMany({
      where: { creatorProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, body: true, tags: true, createdAt: true },
    }),
    prisma.creatorAnalyticsSnapshot.findMany({
      where: { creatorProfileId: profile.id, date: { gte: twoWeeksAgo } },
      orderBy: { date: 'asc' },
    }),
  ]);

  // ── Build context string ──
  const parts: string[] = [];

  // Profile basics
  parts.push(`## Creator Profile`);
  parts.push(`- Name: ${profile.user?.name ?? 'N/A'}`);
  parts.push(`- Niche: ${profile.niche.length > 0 ? profile.niche.join(', ') : 'General'}`);
  parts.push(`- Bio: ${profile.bio ?? 'N/A'}`);

  // Platform stats
  if (profile.platformStats.length > 0) {
    parts.push(`\n## Platform Stats`);
    const totalFollowers = profile.platformStats.reduce((s, p) => s + p.followers, 0);
    parts.push(`- Total followers: ${totalFollowers.toLocaleString()}`);
    for (const ps of profile.platformStats) {
      parts.push(`- ${ps.platform}: ${ps.followers.toLocaleString()} followers, ${ps.engagementRate.toFixed(2)}% engagement`);
    }
  }

  // Growth
  if (snapshots.length >= 2) {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const growth = last.totalFollowers - first.totalFollowers;
    const pct = first.totalFollowers > 0
      ? ((growth / first.totalFollowers) * 100).toFixed(2)
      : '0';
    parts.push(`\n## Growth (last 14 days)`);
    parts.push(`- Follower change: ${growth >= 0 ? '+' : ''}${growth} (${pct}%)`);
  }

  // Content performance
  parts.push(`\n## Content Overview`);
  parts.push(`- Published posts (all time): ${publishedCount}`);
  parts.push(`- Scheduled posts: ${scheduledPosts}`);

  if (recentPosts.length > 0) {
    const totalImpressions = recentPosts.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0);
    const totalLikes = recentPosts.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0);
    const totalComments = recentPosts.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0);
    const totalShares = recentPosts.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0);
    const totalReach = recentPosts.reduce((s, p) => s + (p.analytics?.reach ?? 0), 0);

    parts.push(`\n## Recent Performance (last 30 days, ${recentPosts.length} posts)`);
    parts.push(`- Total impressions: ${totalImpressions.toLocaleString()}`);
    parts.push(`- Total reach: ${totalReach.toLocaleString()}`);
    parts.push(`- Total likes: ${totalLikes.toLocaleString()}`);
    parts.push(`- Total comments: ${totalComments.toLocaleString()}`);
    parts.push(`- Total shares: ${totalShares.toLocaleString()}`);

    if (totalReach > 0) {
      const avgEng = ((totalLikes + totalComments + totalShares) / totalReach * 100).toFixed(2);
      parts.push(`- Avg engagement rate: ${avgEng}%`);
    }

    // Top posts
    const sorted = [...recentPosts]
      .filter((p) => p.analytics)
      .sort((a, b) => {
        const engA = (a.analytics?.likes ?? 0) + (a.analytics?.comments ?? 0) + (a.analytics?.shares ?? 0);
        const engB = (b.analytics?.likes ?? 0) + (b.analytics?.comments ?? 0) + (b.analytics?.shares ?? 0);
        return engB - engA;
      });

    if (sorted.length > 0) {
      parts.push(`\n## Top Performing Posts`);
      for (const p of sorted.slice(0, 3)) {
        const eng = (p.analytics?.likes ?? 0) + (p.analytics?.comments ?? 0) + (p.analytics?.shares ?? 0);
        const caption = (p.caption ?? '').slice(0, 80);
        parts.push(`- [${p.platform}/${p.postType}] "${caption}..." — ${eng} engagements, ${(p.analytics?.reach ?? 0).toLocaleString()} reach`);
      }
    }
  }

  // Revenue
  const totalRev = revenueTotal._sum.amount ?? 0;
  const pipeline = activeDealValue._sum.dealValue ?? 0;
  if (totalRev > 0 || pipeline > 0) {
    parts.push(`\n## Revenue`);
    parts.push(`- Total revenue: $${totalRev.toLocaleString()}`);
    parts.push(`- Active pipeline value: $${pipeline.toLocaleString()}`);
  }

  // Campaigns & Community
  parts.push(`\n## Activity`);
  parts.push(`- Active campaigns: ${activeCampaigns}`);
  parts.push(`- Pending community interactions: ${pendingInteractions}`);

  // Ideas
  if (ideas.length > 0) {
    parts.push(`\n## Recent Ideas`);
    for (const idea of ideas.slice(0, 5)) {
      const tags = idea.tags.length > 0 ? ` [${idea.tags.join(', ')}]` : '';
      parts.push(`- "${idea.title}"${tags}`);
    }
  }

  return parts.join('\n');
}
