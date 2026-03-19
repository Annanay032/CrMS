import type { Response } from 'express';
import * as rssService from '../services/rss.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

async function getCreatorProfileId(userId: string): Promise<string> {
  const profile = await prisma.creatorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, niche: [], languages: ['en'] },
  });
  return profile.id;
}

export async function createFeed(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const feed = await rssService.createFeed(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: feed });
}

export async function getFeeds(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const feeds = await rssService.getFeeds(creatorProfileId);
  res.json({ success: true, data: feeds });
}

export async function deleteFeed(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  await rssService.deleteFeed(req.params.id as string, creatorProfileId);
  res.json({ success: true, message: 'Feed deleted' });
}

export async function toggleFeed(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const feed = await rssService.toggleFeed(req.params.id as string, creatorProfileId, req.body.isActive);
  res.json({ success: true, data: feed });
}
