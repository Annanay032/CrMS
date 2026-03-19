import webpush from 'web-push';
import { prisma } from '../config/index.js';
import { env } from '../config/env.js';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_CONTACT_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_CONTACT_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Register a push subscription for a user (called from the frontend after service-worker subscribe).
 */
export async function registerSubscription(userId: string, subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  await prisma.userSettings.upsert({
    where: { userId },
    update: { pushSubscription: subscription as object },
    create: { userId, pushSubscription: subscription as object },
  });
}

/**
 * Send a push notification to a specific user.
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!env.VAPID_PUBLIC_KEY) {
    logger.debug('VAPID not configured — skipping push notification');
    return;
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  if (!settings?.pushSubscription) {
    logger.debug(`No push subscription for user ${userId}`);
    return;
  }

  const subscription = settings.pushSubscription as unknown as webpush.PushSubscription;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: unknown) {
    // If subscription is expired / invalid, remove it
    if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
      await prisma.userSettings.update({
        where: { userId },
        data: { pushSubscription: Prisma.DbNull },
      });
      logger.info(`Removed expired push subscription for user ${userId}`);
    } else {
      logger.error(`Push notification failed for user ${userId}`, err);
    }
  }
}

/**
 * Get the public VAPID key (sent to the frontend for subscription).
 */
export function getVapidPublicKey() {
  return env.VAPID_PUBLIC_KEY ?? null;
}
