import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { getPlatformService } from '../services/platform.service.js';
import { decrypt } from '../utils/crypto.js';

export async function publishScheduledPosts() {
  const now = new Date();
  const window = new Date(now.getTime() + 2 * 60 * 1000);

  const posts = await prisma.contentPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: window, gte: new Date(now.getTime() - 5 * 60 * 1000) },
    },
    include: {
      creatorProfile: {
        include: {
          user: { include: { oauthAccounts: true } },
        },
      },
    },
  });

  for (const post of posts) {
    try {
      const oauthAccount = post.creatorProfile.user.oauthAccounts.find(
        (a) => a.provider === post.platform,
      );

      if (!oauthAccount) {
        logger.warn(`No OAuth token for ${post.platform} — post ${post.id}`);
        await prisma.contentPost.update({
          where: { id: post.id },
          data: { status: 'FAILED', lastError: `No OAuth token for ${post.platform}` },
        });
        continue;
      }

      const platformService = getPlatformService(post.platform);
      const accessToken = decrypt(oauthAccount.accessToken);

      const result = await platformService.publish(accessToken, {
        caption: post.caption ?? undefined,
        mediaUrls: post.mediaUrls,
        postType: post.postType,
      });

      await prisma.contentPost.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalPostId: result.externalPostId,
          lastError: null,
        },
      });

      logger.info(`Published post ${post.id} to ${post.platform}: ${result.externalPostId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const retryCount = post.retryCount + 1;
      const maxRetries = post.maxRetries;

      if (retryCount < maxRetries) {
        // Exponential backoff: 2^retryCount minutes (2, 4, 8, ...)
        const backoffMs = Math.pow(2, retryCount) * 60 * 1000;
        const nextRetryAt = new Date(now.getTime() + backoffMs);

        await prisma.contentPost.update({
          where: { id: post.id },
          data: {
            retryCount,
            lastError: errorMessage,
            scheduledAt: nextRetryAt, // reschedule for retry
          },
        });

        logger.warn(
          `Publish failed for post ${post.id} (attempt ${retryCount}/${maxRetries}), retrying at ${nextRetryAt.toISOString()}`,
        );
      } else {
        await prisma.contentPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            retryCount,
            lastError: errorMessage,
          },
        });
        logger.error(`Failed to publish post ${post.id} after ${maxRetries} attempts: ${errorMessage}`);
      }
    }
  }

  return posts.length;
}
