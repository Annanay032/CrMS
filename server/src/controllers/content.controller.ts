import type { Response } from 'express';
import * as contentService from '../services/content.service.js';
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

export async function createPost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const post = await contentService.createPost(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: post });
}

export async function updatePost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const post = await contentService.updatePost(req.params.id as string, creatorProfileId, req.body);
  res.json({ success: true, data: post });
}

export async function deletePost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  await contentService.deletePost(req.params.id as string, creatorProfileId);
  res.json({ success: true, message: 'Post deleted' });
}

export async function getCalendar(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const posts = await contentService.getCalendar(creatorProfileId, month, year);
  res.json({ success: true, data: posts });
}

export async function getPostsByStatus(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const status = req.params.status as any;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { posts, total } = await contentService.getPostsByStatus(creatorProfileId, status, page, limit);
  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
