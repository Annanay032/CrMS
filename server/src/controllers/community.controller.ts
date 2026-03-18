import type { Response } from 'express';
import * as communityService from '../services/community.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

async function getCreatorProfileId(userId: string): Promise<string> {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw Object.assign(new Error('Creator profile not found'), { statusCode: 404 });
  return profile.id;
}

export async function getInteractions(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filters = {
    platform: req.query.platform as string | undefined,
    interactionType: req.query.interactionType as string | undefined,
    sentiment: req.query.sentiment as string | undefined,
    responded: req.query.responded === 'true' ? true : req.query.responded === 'false' ? false : undefined,
  };

  const { interactions, total } = await communityService.getInteractions(creatorProfileId, page, limit, filters as never);
  res.json({
    success: true,
    data: interactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function markResponded(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const interaction = await communityService.markResponded(req.params.id as string, creatorProfileId);
  res.json({ success: true, data: interaction });
}

export async function getStats(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const stats = await communityService.getCommunityStats(creatorProfileId);
  res.json({ success: true, data: stats });
}
