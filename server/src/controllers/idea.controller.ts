import type { Response } from 'express';
import * as ideaService from '../services/idea.service.js';
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

// ─── Ideas ──────────────────────────────────────────────────

export async function createIdea(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const idea = await ideaService.createIdea(cpId, req.body);
  res.status(201).json({ success: true, data: idea });
}

export async function updateIdea(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const idea = await ideaService.updateIdea(req.params.id as string, cpId, req.body);
  res.json({ success: true, data: idea });
}

export async function deleteIdea(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  await ideaService.deleteIdea(req.params.id as string, cpId);
  res.json({ success: true, message: 'Idea deleted' });
}

export async function getIdeas(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const { status, tagId, page, limit } = req.query;
  const result = await ideaService.getIdeas(cpId, {
    status: status as any,
    tagId: tagId as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({
    success: true,
    data: result.ideas,
    pagination: {
      total: result.total,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    },
  });
}

export async function getIdeaById(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const idea = await ideaService.getIdeaById(req.params.id as string, cpId);
  if (!idea) {
    res.status(404).json({ success: false, error: 'Idea not found' });
    return;
  }
  res.json({ success: true, data: idea });
}

// ─── Tags ───────────────────────────────────────────────────

export async function createTag(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const tag = await ideaService.createTag(cpId, req.body);
  res.status(201).json({ success: true, data: tag });
}

export async function getTags(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const tags = await ideaService.getTags(cpId);
  res.json({ success: true, data: tags });
}

export async function updateTag(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  const tag = await ideaService.updateTag(req.params.id as string, cpId, req.body);
  res.json({ success: true, data: tag });
}

export async function deleteTag(req: AuthRequest, res: Response) {
  const cpId = await getCreatorProfileId(req.user!.userId);
  await ideaService.deleteTag(req.params.id as string, cpId);
  res.json({ success: true, message: 'Tag deleted' });
}

// ─── Templates ──────────────────────────────────────────────

export async function getTemplates(req: AuthRequest, res: Response) {
  const templates = await ideaService.getTemplates(req.user!.userId);
  res.json({ success: true, data: templates });
}

export async function createTemplate(req: AuthRequest, res: Response) {
  const template = await ideaService.createTemplate(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: template });
}
