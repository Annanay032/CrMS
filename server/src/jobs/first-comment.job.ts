import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { getValidAccessToken } from '../services/account.service.js';

export interface FirstCommentJobData {
  postId: string;
  platform: string;
  externalPostId: string;
  comment: string;
  creatorProfileId: string;
  attempt: number;
}

export async function postFirstComment(data: FirstCommentJobData) {
  const { postId, platform, externalPostId, comment, creatorProfileId, attempt } = data;

  // Fetch OAuth token
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    include: { user: { include: { oauthAccounts: true } } },
  });

  const oauthAccount = profile?.user.oauthAccounts.find((a) => a.provider === platform);
  if (!oauthAccount) {
    logger.warn(`First comment: no OAuth token for ${platform}, post ${postId}`);
    return;
  }

  const accessToken = await getValidAccessToken(oauthAccount);

  if (platform === 'YOUTUBE') {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId: externalPostId,
            topLevelComment: {
              snippet: { textOriginal: comment },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      // YouTube returns 403 while video is still processing
      if (res.status === 403 && attempt < 5) {
        throw new Error(`YouTube comment not ready (attempt ${attempt}): ${errBody}`);
      }
      logger.error(`YouTube first comment failed permanently (${res.status}): ${errBody}`, { postId, externalPostId });
      return;
    }

    logger.info(`YouTube first comment posted on ${externalPostId} (attempt ${attempt})`, { postId });
  } else {
    logger.warn(`First comment not implemented for platform ${platform}`, { postId });
  }
}
