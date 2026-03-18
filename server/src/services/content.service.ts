import { prisma } from '../config/index.js';
import type { Platform, PostStatus, PostType } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

export async function createPost(creatorProfileId: string, data: {
  platform: Platform;
  postType: PostType;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  scheduledAt?: Date;
  status?: PostStatus;
}) {
  return prisma.contentPost.create({
    data: {
      creatorProfileId,
      ...data,
      hashtags: data.hashtags ?? [],
      mediaUrls: data.mediaUrls ?? [],
    },
  });
}

export async function updatePost(postId: string, creatorProfileId: string, data: Partial<{
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  scheduledAt: Date;
  status: PostStatus;
}>) {
  return prisma.contentPost.update({
    where: { id: postId, creatorProfileId },
    data,
  });
}

export async function deletePost(postId: string, creatorProfileId: string) {
  return prisma.contentPost.delete({
    where: { id: postId, creatorProfileId },
  });
}

export async function getCalendar(creatorProfileId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      OR: [
        { scheduledAt: { gte: start, lte: end } },
        { publishedAt: { gte: start, lte: end } },
        { createdAt: { gte: start, lte: end }, scheduledAt: null },
      ],
    },
    include: { analytics: true },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function getPostsByStatus(creatorProfileId: string, status: PostStatus, page: number, limit: number) {
  const { skip, take } = paginate(page, limit);

  const [posts, total] = await Promise.all([
    prisma.contentPost.findMany({
      where: { creatorProfileId, status },
      skip,
      take,
      include: { analytics: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contentPost.count({ where: { creatorProfileId, status } }),
  ]);

  return { posts, total };
}

export async function getScheduledPosts() {
  const now = new Date();
  const window = new Date(now.getTime() + 2 * 60 * 1000); // 2-min window

  return prisma.contentPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: window, gte: now },
    },
    include: {
      creatorProfile: {
        include: { user: { include: { oauthAccounts: true } } },
      },
    },
  });
}
