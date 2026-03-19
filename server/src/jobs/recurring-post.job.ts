import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Scans all recurring posts and clones them when their recurrence rule is due.
 * Supports iCal RRULE-like patterns: FREQ=DAILY, FREQ=WEEKLY;BYDAY=MO,WE,FR, etc.
 */
export async function processRecurringPosts() {
  const now = new Date();

  const recurringPosts = await prisma.contentPost.findMany({
    where: {
      isRecurring: true,
      status: 'PUBLISHED',
      sourcePostId: null, // only originals, not clones
    },
  });

  let clonedCount = 0;

  for (const post of recurringPosts) {
    try {
      if (post.maxRecurrences != null && post.recurrenceCount >= post.maxRecurrences) {
        continue;
      }

      const nextDate = getNextOccurrence(post.recurrenceRule, post.lastRecurredAt ?? post.publishedAt, now);
      if (!nextDate) continue;

      // Clone the post as a new SCHEDULED post
      await prisma.contentPost.create({
        data: {
          creatorProfileId: post.creatorProfileId,
          platform: post.platform,
          postType: post.postType,
          caption: post.caption,
          hashtags: post.hashtags,
          mediaUrls: post.mediaUrls,
          scheduledAt: nextDate,
          status: 'SCHEDULED',
          firstComment: post.firstComment,
          platformOverrides: post.platformOverrides ?? undefined,
          thumbnailUrl: post.thumbnailUrl,
          sourcePostId: post.id,
          teamId: post.teamId,
        },
      });

      await prisma.contentPost.update({
        where: { id: post.id },
        data: {
          recurrenceCount: { increment: 1 },
          lastRecurredAt: now,
        },
      });

      clonedCount++;
      logger.info(`Cloned recurring post ${post.id} → scheduled for ${nextDate.toISOString()}`);
    } catch (err) {
      logger.error(`Failed to process recurring post ${post.id}`, err);
    }
  }

  logger.info(`Recurring post job completed: ${clonedCount} posts cloned`);
  return clonedCount;
}

/**
 * Simple RRULE parser: determines the next occurrence date.
 * Supports FREQ=DAILY, FREQ=WEEKLY, FREQ=WEEKLY;BYDAY=MO,TU,...
 */
function getNextOccurrence(
  rule: string | null,
  lastOccurrence: Date | null,
  now: Date,
): Date | null {
  if (!rule) return null;

  const parts = rule.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, val] = part.split('=');
    if (key && val) acc[key.toUpperCase()] = val.toUpperCase();
    return acc;
  }, {});

  const freq = parts['FREQ'];
  const lastDate = lastOccurrence ?? now;

  if (freq === 'DAILY') {
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 1);
    // Preserve original time
    next.setHours(lastDate.getHours(), lastDate.getMinutes(), 0, 0);
    return next > now ? next : null;
  }

  if (freq === 'WEEKLY') {
    const byDay = parts['BYDAY']?.split(',') ?? [];
    const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

    if (byDay.length === 0) {
      // Same day each week
      const next = new Date(lastDate);
      next.setDate(next.getDate() + 7);
      next.setHours(lastDate.getHours(), lastDate.getMinutes(), 0, 0);
      return next > now ? next : null;
    }

    const targetDays = byDay.map((d) => dayMap[d]).filter((d) => d !== undefined);
    const currentDay = now.getDay();

    // Find the next day in the BYDAY list
    for (let offset = 1; offset <= 7; offset++) {
      const candidateDay = (currentDay + offset) % 7;
      if (targetDays.includes(candidateDay)) {
        const next = new Date(now);
        next.setDate(now.getDate() + offset);
        next.setHours(lastDate.getHours(), lastDate.getMinutes(), 0, 0);
        return next;
      }
    }
  }

  if (freq === 'MONTHLY') {
    const next = new Date(lastDate);
    next.setMonth(next.getMonth() + 1);
    next.setHours(lastDate.getHours(), lastDate.getMinutes(), 0, 0);
    return next > now ? next : null;
  }

  return null;
}
