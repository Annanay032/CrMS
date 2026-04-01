import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { getPlatformService } from '../services/platform.service.js';
import { getValidAccessToken } from '../services/account.service.js';

export async function fetchAnalytics() {
  // Find published posts that need analytics updates (published in last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const posts = await prisma.contentPost.findMany({
    where: {
      status: 'PUBLISHED',
      externalPostId: { not: null },
      publishedAt: { gte: since },
    },
    include: {
      creatorProfile: {
        include: {
          user: { include: { oauthAccounts: true } },
        },
      },
    },
  });

  let updated = 0;
  for (const post of posts) {
    try {
      const oauthAccount = post.creatorProfile.user.oauthAccounts.find(
        (a) => a.provider === post.platform,
      );
      if (!oauthAccount || !post.externalPostId) continue;

      const platformService = getPlatformService(post.platform);
      const accessToken = await getValidAccessToken(oauthAccount);
      const analytics = await platformService.getAnalytics(accessToken, post.externalPostId);

      await prisma.postAnalytics.upsert({
        where: { postId: post.id },
        update: { ...analytics, fetchedAt: new Date() },
        create: { postId: post.id, ...analytics },
      });

      // Detect boosted / promoted posts from platform analytics
      if (analytics.isPaid || analytics.adSpend) {
        await prisma.contentPost.update({
          where: { id: post.id },
          data: {
            isBoosted: true,
            ...(analytics.adSpend ? { adSpend: Number(analytics.adSpend) } : {}),
          },
        });
      }

      updated++;
    } catch (err) {
      logger.error(`Failed to fetch analytics for post ${post.id}`, err);
    }
  }

  // Update creator snapshots
  const creators = await prisma.creatorProfile.findMany({
    include: { platformStats: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const creator of creators) {
    const totalFollowers = creator.platformStats.reduce((s, p) => s + p.followers, 0);
    const totalEngagement = creator.platformStats.reduce(
      (s, p) => s + p.avgLikes + p.avgComments,
      0,
    );

    const prevSnapshot = await prisma.creatorAnalyticsSnapshot.findFirst({
      where: { creatorProfileId: creator.id },
      orderBy: { date: 'desc' },
    });

    const growthRate = prevSnapshot && prevSnapshot.totalFollowers > 0
      ? ((totalFollowers - prevSnapshot.totalFollowers) / prevSnapshot.totalFollowers) * 100
      : 0;

    await prisma.creatorAnalyticsSnapshot.upsert({
      where: { creatorProfileId_date: { creatorProfileId: creator.id, date: today } },
      update: { totalFollowers, totalEngagement, growthRate },
      create: { creatorProfileId: creator.id, date: today, totalFollowers, totalEngagement, growthRate },
    });
  }

  logger.info(`Analytics fetch complete: ${updated} posts updated, ${creators.length} snapshots`);
}
