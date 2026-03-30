import type { Response } from 'express';
import * as channelService from '../services/channel.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';
import type { Platform } from '../types/enums.js';

async function getCreatorProfileId(userId: string): Promise<string> {
  const profile = await prisma.creatorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, niche: [], languages: ['en'] },
  });
  return profile.id;
}

export async function getChannelOverview(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const platform = (req.params.platform as string).toUpperCase() as Platform;
  const data = await channelService.getChannelOverview(creatorProfileId, platform);
  res.json({ success: true, data });
}

export async function getChannelPosts(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const platform = (req.params.platform as string).toUpperCase() as Platform;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const postType = req.query.postType as string | undefined;
  const search = req.query.search as string | undefined;

  const { posts, total } = await channelService.getChannelPosts(creatorProfileId, platform, {
    page, limit, status, postType, search,
  });

  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getChannelAnalytics(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const platform = (req.params.platform as string).toUpperCase() as Platform;
  const days = Number(req.query.days) || 30;
  const data = await channelService.getChannelAnalytics(creatorProfileId, platform, days);
  res.json({ success: true, data });
}
