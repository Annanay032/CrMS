import type { Response } from 'express';
import * as notificationService from '../services/notification.service.js';
import * as webPushService from '../services/web-push.service.js';
import type { AuthRequest } from '../types/common.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const unreadOnly = req.query.unreadOnly === 'true';
  const data = await notificationService.getNotifications(req.user!.userId, { page, limit, unreadOnly });
  res.json({ success: true, data });
}

export async function markRead(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await notificationService.markRead(req.user!.userId, id);
  res.json({ success: true });
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await notificationService.markAllRead(req.user!.userId);
  res.json({ success: true });
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await notificationService.deleteNotification(req.user!.userId, id);
  res.json({ success: true });
}

/* ── Push Subscription ─────────────────────────────────── */

export async function registerPushSubscription(req: AuthRequest, res: Response) {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
  await webPushService.registerSubscription(req.user!.userId, { endpoint, keys });
  res.json({ success: true });
}

export async function getVapidKey(_req: AuthRequest, res: Response) {
  const key = webPushService.getVapidPublicKey();
  res.json({ success: true, data: { publicKey: key } });
}
