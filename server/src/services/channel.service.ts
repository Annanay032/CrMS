import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';
import type { Platform } from '../types/enums.js';

// ─── Channel Overview (per-platform dashboard) ──────────────

export async function getChannelOverview(creatorProfileId: string, platform: Platform) {
  const [totalPosts, publishedPosts, scheduledPosts, draftPosts, recentPosts, analyticsAgg] = await Promise.all([
    prisma.contentPost.count({ where: { creatorProfileId, platform, parentPostId: null } }),
    prisma.contentPost.count({ where: { creatorProfileId, platform, status: 'PUBLISHED' } }),
    prisma.contentPost.count({ where: { creatorProfileId, platform, status: 'SCHEDULED' } }),
    prisma.contentPost.count({ where: { creatorProfileId, platform, status: 'DRAFT' } }),
    prisma.contentPost.findMany({
      where: { creatorProfileId, platform, parentPostId: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { analytics: true },
    }),
    prisma.postAnalytics.aggregate({
      where: { post: { creatorProfileId, platform } },
      _sum: {
        impressions: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
        clicks: true,
        videoViews: true,
      },
      _avg: {
        avgWatchTime: true,
      },
    }),
  ]);

  return {
    platform,
    stats: {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
    },
    analytics: {
      impressions: analyticsAgg._sum.impressions ?? 0,
      reach: analyticsAgg._sum.reach ?? 0,
      likes: analyticsAgg._sum.likes ?? 0,
      comments: analyticsAgg._sum.comments ?? 0,
      shares: analyticsAgg._sum.shares ?? 0,
      saves: analyticsAgg._sum.saves ?? 0,
      clicks: analyticsAgg._sum.clicks ?? 0,
      videoViews: analyticsAgg._sum.videoViews ?? 0,
      avgWatchTime: analyticsAgg._avg.avgWatchTime ?? 0,
    },
    recentPosts,
  };
}

// ─── Channel Posts ──────────────────────────────────────────

export async function getChannelPosts(creatorProfileId: string, platform: Platform, opts: {
  page: number;
  limit: number;
  status?: string;
  postType?: string;
  search?: string;
}) {
  const { skip, take } = paginate(opts.page, opts.limit);

  const where: Record<string, unknown> = {
    creatorProfileId,
    platform,
    parentPostId: null,
    ...(opts.status && { status: opts.status }),
    ...(opts.postType && { postType: opts.postType }),
    ...(opts.search && { caption: { contains: opts.search, mode: 'insensitive' } }),
  };

  const [posts, total] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      skip,
      take,
      include: { analytics: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contentPost.count({ where }),
  ]);

  return { posts, total };
}

// ─── Channel Analytics Over Time ────────────────────────────

export async function getChannelAnalytics(creatorProfileId: string, platform: Platform, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Per-post analytics for posts on this platform
  const posts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform,
      status: 'PUBLISHED',
      publishedAt: { gte: since },
    },
    include: { analytics: true },
    orderBy: { publishedAt: 'asc' },
  });

  // Top performing posts
  const topPosts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform,
      status: 'PUBLISHED',
      analytics: { isNot: null },
    },
    include: { analytics: true },
    orderBy: { analytics: { impressions: 'desc' } },
    take: 10,
  });

  // Creator analytics snapshots for follower trend
  const snapshots = await prisma.creatorAnalyticsSnapshot.findMany({
    where: {
      creatorProfileId,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });

  return {
    posts: posts.map((p) => ({
      id: p.id,
      caption: p.caption?.slice(0, 80),
      postType: p.postType,
      publishedAt: p.publishedAt,
      analytics: p.analytics,
    })),
    topPosts: topPosts.map((p) => ({
      id: p.id,
      caption: p.caption?.slice(0, 80),
      postType: p.postType,
      publishedAt: p.publishedAt,
      analytics: p.analytics,
    })),
    followerTrend: snapshots.map((s) => ({
      date: s.date,
      followers: s.totalFollowers,
      engagement: s.totalEngagement,
      growthRate: s.growthRate,
    })),
  };
}
