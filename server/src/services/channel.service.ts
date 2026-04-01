import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { getPlatformService } from './platform.service.js';
import { getValidAccessToken } from './account.service.js';
import type { Platform } from '../types/enums.js';

// ─── Channel Overview (per-platform dashboard) ──────────────

export async function getChannelOverview(creatorProfileId: string, platform: Platform) {
  const staleThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
  const recentPublishThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

  const recentStaleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 min for recent posts

  // Check for published posts missing analytics or with stale data
  const stalePosts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform,
      status: 'PUBLISHED',
      externalPostId: { not: null },
      OR: [
        { analytics: null },
        { analytics: { fetchedAt: { lt: staleThreshold } } },
        // Re-fetch every 10 min for posts published in the last 24h
        {
          publishedAt: { gte: recentPublishThreshold },
          analytics: { fetchedAt: { lt: recentStaleThreshold } },
        },
      ],
    },
    include: {
      creatorProfile: {
        include: { user: { include: { oauthAccounts: true } } },
      },
    },
  });

  // On-demand fetch for stale/missing analytics
  if (stalePosts.length > 0) {
    const platformService = getPlatformService(platform);
    for (const post of stalePosts) {
      try {
        const oauthAccount = post.creatorProfile.user.oauthAccounts.find((a) => a.provider === platform);
        if (!oauthAccount || !post.externalPostId) continue;
        const accessToken = await getValidAccessToken(oauthAccount);
        const analytics = await platformService.getAnalytics(accessToken, post.externalPostId);
        await prisma.postAnalytics.upsert({
          where: { postId: post.id },
          update: { ...analytics, fetchedAt: new Date() },
          create: { postId: post.id, ...analytics },
        });
      } catch (err) {
        logger.warn(`On-demand analytics fetch failed for post ${post.id}`, { error: (err as Error).message });
      }
    }
  }

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
        estimatedRevenue: true,
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
      estimatedRevenue: analyticsAgg._sum.estimatedRevenue ?? 0,
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
  const staleThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
  const recentStaleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 min for recent posts
  const recentPublishThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

  // Per-post analytics for posts on this platform
  const posts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform,
      status: 'PUBLISHED',
      publishedAt: { gte: since },
    },
    include: {
      analytics: true,
      creatorProfile: {
        include: { user: { include: { oauthAccounts: true } } },
      },
    },
    orderBy: { publishedAt: 'asc' },
  });

  // On-demand: fetch analytics for posts missing data or with stale data
  const stale = posts.filter(
    (p) => p.externalPostId && (
      !p.analytics ||
      (p.analytics.fetchedAt && p.analytics.fetchedAt < staleThreshold) ||
      // Re-fetch every 10 min for posts published in the last 24h
      (p.publishedAt && p.publishedAt >= recentPublishThreshold &&
       p.analytics?.fetchedAt && p.analytics.fetchedAt < recentStaleThreshold) ||
      // Re-fetch if any key metric is still 0 for recently published posts
      ((p.analytics.impressions === 0 || p.analytics.likes === 0) &&
       p.publishedAt && p.publishedAt >= recentPublishThreshold)
    ),
  );

  if (stale.length > 0) {
    const platformService = getPlatformService(platform);
    for (const post of stale) {
      try {
        const oauthAccount = post.creatorProfile.user.oauthAccounts.find((a) => a.provider === platform);
        if (!oauthAccount || !post.externalPostId) continue;
        const accessToken = await getValidAccessToken(oauthAccount);
        const analytics = await platformService.getAnalytics(accessToken, post.externalPostId);
        const upserted = await prisma.postAnalytics.upsert({
          where: { postId: post.id },
          update: { ...analytics, fetchedAt: new Date() },
          create: { postId: post.id, ...analytics },
        });
        post.analytics = upserted;
      } catch (err) {
        logger.warn(`On-demand analytics fetch failed for post ${post.id}`, { error: (err as Error).message });
      }
    }
  }

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
