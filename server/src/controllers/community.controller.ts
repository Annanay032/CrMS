import type { Response } from 'express';
import * as communityService from '../services/community.service.js';
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

/* ── Interactions / Inbox ──────────────────────────────── */

export async function getInteractions(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filters = {
    platform: req.query.platform as string | undefined,
    interactionType: req.query.interactionType as string | undefined,
    sentiment: req.query.sentiment as string | undefined,
    responded: req.query.responded === 'true' ? true : req.query.responded === 'false' ? false : undefined,
    isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
    caseStatus: req.query.caseStatus as string | undefined,
    priority: req.query.priority as string | undefined,
    assignedTo: req.query.assignedTo as string | undefined,
    search: req.query.search as string | undefined,
    sortBy: req.query.sortBy as 'newest' | 'oldest' | 'priority' | undefined,
  };

  const { interactions, total } = await communityService.getInteractions(creatorProfileId, page, limit, filters as never);
  res.json({
    success: true,
    data: interactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getInteractionById(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const interaction = await communityService.getInteractionById(req.params.id as string, creatorProfileId);
  if (!interaction) { res.status(404).json({ success: false, message: 'Interaction not found' }); return; }
  res.json({ success: true, data: interaction });
}

export async function markResponded(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const interaction = await communityService.markResponded(req.params.id as string, creatorProfileId);
  res.json({ success: true, data: interaction });
}

export async function markRead(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const interaction = await communityService.markRead(req.params.id as string, creatorProfileId);
  res.json({ success: true, data: interaction });
}

export async function markBulkRead(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { ids } = req.body as { ids: string[] };
  const result = await communityService.markBulkRead(ids, creatorProfileId);
  res.json({ success: true, data: { count: result.count } });
}

export async function updateCase(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { caseStatus, priority, assignedTo, tags } = req.body as {
    caseStatus?: string; priority?: string; assignedTo?: string | null; tags?: string[];
  };
  const interaction = await communityService.updateCase(req.params.id as string, creatorProfileId, { caseStatus, priority, assignedTo, tags });
  res.json({ success: true, data: interaction });
}

export async function assignInteraction(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { assignedTo } = req.body as { assignedTo: string | null };
  const interaction = await communityService.assignInteraction(req.params.id as string, creatorProfileId, assignedTo);
  res.json({ success: true, data: interaction });
}

/* ── Stats ─────────────────────────────────────────────── */

export async function getStats(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const stats = await communityService.getCommunityStats(creatorProfileId);
  res.json({ success: true, data: stats });
}

/* ── Saved Replies ─────────────────────────────────────── */

export async function getSavedReplies(req: AuthRequest, res: Response) {
  const replies = await communityService.getSavedReplies(req.user!.userId);
  res.json({ success: true, data: replies });
}

export async function createSavedReply(req: AuthRequest, res: Response) {
  const { title, body, tags, shortcut } = req.body as { title: string; body: string; tags?: string[]; shortcut?: string };
  const reply = await communityService.createSavedReply(req.user!.userId, { title, body, tags, shortcut });
  res.json({ success: true, data: reply });
}

export async function updateSavedReply(req: AuthRequest, res: Response) {
  const { title, body, tags, shortcut } = req.body as { title?: string; body?: string; tags?: string[]; shortcut?: string };
  const reply = await communityService.updateSavedReply(req.params.id as string, req.user!.userId, { title, body, tags, shortcut });
  res.json({ success: true, data: reply });
}

export async function deleteSavedReply(req: AuthRequest, res: Response) {
  await communityService.deleteSavedReply(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Saved reply deleted' });
}

export async function useSavedReply(req: AuthRequest, res: Response) {
  const reply = await communityService.incrementSavedReplyUsage(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: reply });
}

/* ── Voice Profile ─────────────────────────────────────── */

export async function getVoiceProfile(req: AuthRequest, res: Response) {
  const profile = await communityService.getVoiceProfile(req.user!.userId);
  res.json({ success: true, data: profile });
}

export async function upsertVoiceProfile(req: AuthRequest, res: Response) {
  const { tonePreferences, vocabulary, exampleReplies } = req.body as {
    tonePreferences: string[]; vocabulary: string[]; exampleReplies?: string[];
  };
  const profile = await communityService.upsertVoiceProfile(req.user!.userId, { tonePreferences, vocabulary, exampleReplies });
  res.json({ success: true, data: profile });
}
