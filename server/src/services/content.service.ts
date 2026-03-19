import { prisma } from '../config/index.js';
import type { Prisma } from '@prisma/client';
import type { Platform, PostStatus, PostType } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

// ─── Post CRUD ──────────────────────────────────────────────

export async function createPost(creatorProfileId: string, data: {
  platform: Platform;
  postType: PostType;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  scheduledAt?: Date;
  status?: PostStatus;
  firstComment?: string;
  platformOverrides?: Record<string, unknown>;
  bulkGroupId?: string;
  ideaId?: string;
  thumbnailUrl?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  maxRecurrences?: number;
  repostSourceUrl?: string;
  repostType?: string;
}) {
  return prisma.contentPost.create({
    data: {
      creatorProfileId,
      platform: data.platform,
      postType: data.postType,
      caption: data.caption,
      hashtags: data.hashtags ?? [],
      mediaUrls: data.mediaUrls ?? [],
      scheduledAt: data.scheduledAt,
      status: data.status,
      firstComment: data.firstComment,
      platformOverrides: (data.platformOverrides as Prisma.InputJsonValue) ?? undefined,
      bulkGroupId: data.bulkGroupId,
      ideaId: data.ideaId,
      thumbnailUrl: data.thumbnailUrl,
      isRecurring: data.isRecurring ?? false,
      recurrenceRule: data.recurrenceRule,
      maxRecurrences: data.maxRecurrences,
      repostSourceUrl: data.repostSourceUrl,
      repostType: data.repostType,
    },
  });
}

export async function updatePost(postId: string, creatorProfileId: string, data: Partial<{
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  scheduledAt: Date;
  status: PostStatus;
  firstComment: string;
  platformOverrides: Record<string, unknown>;
  thumbnailUrl: string;
  isRecurring: boolean;
  recurrenceRule: string;
  maxRecurrences: number;
}>) {
  return prisma.contentPost.update({
    where: { id: postId, creatorProfileId },
    data: {
      ...data,
      platformOverrides: data.platformOverrides ? (data.platformOverrides as Prisma.InputJsonValue) : undefined,
    },
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

// ─── Autosave ───────────────────────────────────────────────

export async function autosavePost(creatorProfileId: string, postId: string | undefined, data: {
  platform?: Platform;
  postType?: PostType;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  scheduledAt?: Date;
  thumbnailUrl?: string;
}) {
  if (postId) {
    return prisma.contentPost.update({
      where: { id: postId, creatorProfileId },
      data: { ...data, status: 'DRAFT' },
    });
  }
  // Create a new draft if no postId
  return prisma.contentPost.create({
    data: {
      creatorProfileId,
      platform: data.platform ?? 'INSTAGRAM',
      postType: data.postType ?? 'IMAGE',
      caption: data.caption,
      hashtags: data.hashtags ?? [],
      mediaUrls: data.mediaUrls ?? [],
      scheduledAt: data.scheduledAt,
      thumbnailUrl: data.thumbnailUrl,
      status: 'DRAFT',
    },
  });
}

// ─── Search ─────────────────────────────────────────────────

export async function searchContent(creatorProfileId: string, query: string, page: number, limit: number) {
  const { skip, take } = paginate(page, limit);
  const [posts, total] = await Promise.all([
    prisma.contentPost.findMany({
      where: {
        creatorProfileId,
        OR: [
          { caption: { contains: query, mode: 'insensitive' } },
          { hashtags: { hasSome: [query.toLowerCase()] } },
        ],
      },
      skip,
      take,
      include: { analytics: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contentPost.count({
      where: {
        creatorProfileId,
        OR: [
          { caption: { contains: query, mode: 'insensitive' } },
          { hashtags: { hasSome: [query.toLowerCase()] } },
        ],
      },
    }),
  ]);

  return { posts, total };
}

// ─── Queue Operations ───────────────────────────────────────

export async function shuffleQueue(creatorProfileId: string, platform: Platform) {
  const posts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform,
      status: 'SCHEDULED',
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (posts.length < 2) return posts;

  // Collect the time slots
  const timeSlots = posts.map((p) => p.scheduledAt!);

  // Fisher-Yates shuffle on the posts (not the time slots)
  const shuffled = [...posts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Reassign time slots to shuffled posts
  const updates = shuffled.map((post, idx) =>
    prisma.contentPost.update({
      where: { id: post.id },
      data: { scheduledAt: timeSlots[idx] },
    }),
  );

  return prisma.$transaction(updates);
}

export async function injectIntoQueue(
  creatorProfileId: string,
  postId: string,
  position: number, // 0-based index in the queue
) {
  const queuedPosts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      status: 'SCHEDULED',
      scheduledAt: { gte: new Date() },
      id: { not: postId },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const safePos = Math.max(0, Math.min(position, queuedPosts.length));
  const targetSlot = queuedPosts[safePos]?.scheduledAt;

  if (!targetSlot) return null;

  // Shift everything at and after the target slot by 1 minute each
  const updates = [];
  for (let i = queuedPosts.length - 1; i >= safePos; i--) {
    updates.push(
      prisma.contentPost.update({
        where: { id: queuedPosts[i].id },
        data: { scheduledAt: new Date(queuedPosts[i].scheduledAt!.getTime() + 60_000) },
      }),
    );
  }

  updates.push(
    prisma.contentPost.update({
      where: { id: postId },
      data: { scheduledAt: targetSlot, status: 'SCHEDULED' },
    }),
  );

  return prisma.$transaction(updates);
}

// ─── Thread Operations ──────────────────────────────────────

export async function createThread(creatorProfileId: string, data: {
  platform: Platform;
  parts: { caption: string; mediaUrls?: string[] }[];
  scheduledAt?: Date;
  status?: PostStatus;
}) {
  const parentPost = await prisma.contentPost.create({
    data: {
      creatorProfileId,
      platform: data.platform,
      postType: 'THREAD',
      caption: data.parts[0]?.caption,
      hashtags: [],
      mediaUrls: data.parts[0]?.mediaUrls ?? [],
      scheduledAt: data.scheduledAt,
      status: data.status ?? 'DRAFT',
      threadOrder: 0,
    },
  });

  const childPosts = await Promise.all(
    data.parts.slice(1).map((part, idx) =>
      prisma.contentPost.create({
        data: {
          creatorProfileId,
          platform: data.platform,
          postType: 'THREAD',
          caption: part.caption,
          hashtags: [],
          mediaUrls: part.mediaUrls ?? [],
          scheduledAt: data.scheduledAt,
          status: data.status ?? 'DRAFT',
          parentPostId: parentPost.id,
          threadOrder: idx + 1,
        },
      }),
    ),
  );

  return { parentPost, threadParts: [parentPost, ...childPosts] };
}

export async function getThread(postId: string) {
  const parent = await prisma.contentPost.findUnique({
    where: { id: postId },
    include: {
      threadParts: { orderBy: { threadOrder: 'asc' } },
      analytics: true,
    },
  });

  return parent;
}

// ─── Calendar Notes ─────────────────────────────────────────

export async function createCalendarNote(creatorProfileId: string, data: {
  date: Date;
  title: string;
  description?: string;
  color?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
}) {
  return prisma.calendarNote.create({
    data: {
      creatorProfileId,
      ...data,
    },
  });
}

export async function getCalendarNotes(creatorProfileId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return prisma.calendarNote.findMany({
    where: {
      creatorProfileId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: 'asc' },
  });
}

export async function updateCalendarNote(noteId: string, creatorProfileId: string, data: Partial<{
  title: string;
  description: string;
  color: string;
  date: Date;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
}>) {
  return prisma.calendarNote.update({
    where: { id: noteId, creatorProfileId },
    data,
  });
}

export async function deleteCalendarNote(noteId: string, creatorProfileId: string) {
  return prisma.calendarNote.delete({
    where: { id: noteId, creatorProfileId },
  });
}

// ─── Templates ──────────────────────────────────────────────

export async function getTemplates(userId: string, platform?: Platform) {
  return prisma.contentTemplate.findMany({
    where: {
      OR: [
        { isGlobal: true },
        { userId },
      ],
      ...(platform ? { platform } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTemplate(userId: string, data: {
  name: string;
  body: string;
  platform?: Platform;
  category: string;
}) {
  return prisma.contentTemplate.create({
    data: {
      ...data,
      userId,
      isGlobal: false,
    },
  });
}

export async function deleteTemplate(templateId: string, userId: string) {
  return prisma.contentTemplate.delete({
    where: { id: templateId, userId, isGlobal: false },
  });
}

// ─── Instagram Grid Planner (Phase 11) ──────────────────────

/**
 * Get the last N published + scheduled posts for an Instagram account
 * arranged in a 3-column grid preview.
 */
export async function getGridPreview(
  creatorProfileId: string,
  _accountId: string,
  limit: number = 18,
) {
  const posts = await prisma.contentPost.findMany({
    where: {
      creatorProfileId,
      platform: 'INSTAGRAM',
      status: { in: ['PUBLISHED', 'SCHEDULED'] },
    },
    orderBy: [
      { publishedAt: 'desc' },
      { scheduledAt: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      caption: true,
      mediaUrls: true,
      thumbnailUrl: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      postType: true,
    },
  });

  return posts;
}

/**
 * Reorder scheduled posts by adjusting scheduledAt timestamps.
 * Takes an ordered array of post IDs and reassigns their scheduledAt
 * to maintain the desired sequence.
 */
export async function reorderScheduledPosts(
  creatorProfileId: string,
  orderedPostIds: string[],
) {
  // Fetch current scheduled times for these posts
  const posts = await prisma.contentPost.findMany({
    where: {
      id: { in: orderedPostIds },
      creatorProfileId,
      status: 'SCHEDULED',
    },
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, scheduledAt: true },
  });

  // Extract existing timestamps and sort them
  const timestamps = posts
    .map((p) => p.scheduledAt)
    .filter((t): t is Date => t !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  // Reassign timestamps to the new order
  const updates = orderedPostIds.map((postId, i) => {
    if (i < timestamps.length) {
      return prisma.contentPost.update({
        where: { id: postId, creatorProfileId },
        data: { scheduledAt: timestamps[i] },
      });
    }
    return null;
  }).filter(Boolean);

  await prisma.$transaction(updates as ReturnType<typeof prisma.contentPost.update>[]);

  return { reordered: orderedPostIds.length };
}
