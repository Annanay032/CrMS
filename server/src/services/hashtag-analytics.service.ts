import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import type { Platform } from '../types/enums.js';

/**
 * Aggregates hashtag performance data from published posts.
 * Scans posts with analytics and updates the HashtagAnalytics table.
 */
export async function aggregateHashtagAnalytics(creatorProfileId: string) {
  const posts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      status: 'PUBLISHED',
      hashtags: { isEmpty: false },
    },
    include: { analytics: true },
  });

  const hashtagMap = new Map<string, {
    platform: Platform | null;
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEngagement: number;
    lastUsedAt: Date | null;
  }>();

  for (const post of posts) {
    if (!post.analytics) continue;

    for (const rawTag of post.hashtags) {
      const tag = rawTag.toLowerCase().replace(/^#/, '');
      const key = `${tag}::${post.platform}`;

      const existing = hashtagMap.get(key) ?? {
        platform: post.platform as Platform,
        totalPosts: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalEngagement: 0,
        lastUsedAt: null,
      };

      existing.totalPosts++;
      existing.totalImpressions += post.analytics.impressions;
      existing.totalReach += post.analytics.reach;
      existing.totalLikes += post.analytics.likes;
      existing.totalComments += post.analytics.comments;
      existing.totalShares += post.analytics.shares;
      existing.totalEngagement += post.analytics.likes + post.analytics.comments + post.analytics.shares;

      const postDate = post.publishedAt ?? post.createdAt;
      if (!existing.lastUsedAt || postDate > existing.lastUsedAt) {
        existing.lastUsedAt = postDate;
      }

      hashtagMap.set(key, existing);
    }
  }

  let upsertCount = 0;

  for (const [key, data] of hashtagMap) {
    const [hashtag, platform] = key.split('::');
    const avgEngRate = data.totalImpressions > 0
      ? (data.totalEngagement / data.totalImpressions) * 100
      : 0;

    await prisma.hashtagAnalytics.upsert({
      where: {
        creatorProfileId_hashtag_platform: {
          creatorProfileId,
          hashtag,
          platform: platform as Platform,
        },
      },
      update: {
        totalPosts: data.totalPosts,
        totalImpressions: data.totalImpressions,
        totalReach: data.totalReach,
        totalLikes: data.totalLikes,
        totalComments: data.totalComments,
        totalShares: data.totalShares,
        avgEngagementRate: Math.round(avgEngRate * 100) / 100,
        lastUsedAt: data.lastUsedAt,
      },
      create: {
        creatorProfileId,
        hashtag,
        platform: platform as Platform,
        totalPosts: data.totalPosts,
        totalImpressions: data.totalImpressions,
        totalReach: data.totalReach,
        totalLikes: data.totalLikes,
        totalComments: data.totalComments,
        totalShares: data.totalShares,
        avgEngagementRate: Math.round(avgEngRate * 100) / 100,
        lastUsedAt: data.lastUsedAt,
      },
    });

    upsertCount++;
  }

  logger.info(`Hashtag analytics aggregated for ${creatorProfileId}: ${upsertCount} hashtags updated`);
  return upsertCount;
}

/**
 * Get hashtag analytics for a creator, with optional filtering and sorting.
 */
export async function getHashtagAnalytics(
  creatorProfileId: string,
  options: {
    platform?: Platform;
    sortBy?: 'totalPosts' | 'totalImpressions' | 'totalReach' | 'avgEngagementRate';
    limit?: number;
  } = {},
) {
  return prisma.hashtagAnalytics.findMany({
    where: {
      creatorProfileId,
      ...(options.platform ? { platform: options.platform } : {}),
    },
    orderBy: { [options.sortBy ?? 'totalImpressions']: 'desc' },
    take: options.limit ?? 50,
  });
}

/**
 * Get top performing hashtags by engagement rate.
 */
export async function getTopHashtags(
  creatorProfileId: string,
  limit: number = 10,
) {
  return prisma.hashtagAnalytics.findMany({
    where: {
      creatorProfileId,
      totalPosts: { gte: 2 }, // only hashtags used more than once
    },
    orderBy: { avgEngagementRate: 'desc' },
    take: limit,
  });
}
