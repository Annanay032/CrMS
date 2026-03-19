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
        // Phase 14: Fall back to manual posting via push notification
        logger.warn(`No OAuth token for ${post.platform} — marking post ${post.id} as PENDING_MANUAL`);
        await prisma.contentPost.update({
          where: { id: post.id },
          data: { status: 'PENDING_MANUAL', lastError: `No OAuth token for ${post.platform}` },
        });

        // Send push notification for manual posting
        try {
          const { sendPushNotification } = await import('../services/web-push.service.js');
          await sendPushNotification(post.creatorProfile.userId, {
            title: 'Post Ready to Publish',
            body: `Your ${post.platform} post is ready. Tap to publish manually.`,
            data: { type: 'PENDING_MANUAL', postId: post.id },
          });
        } catch { /* push notification is best-effort */ }
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
