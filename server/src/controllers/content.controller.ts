import type { Response } from 'express';
import * as contentService from '../services/content.service.js';
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

export async function createPost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const post = await contentService.createPost(creatorProfileId, req.body);
  await contentService.logPostActivity(post.id, req.user!.userId, 'CREATED', `Post created as ${post.status}`, { platform: post.platform, postType: post.postType });
  res.status(201).json({ success: true, data: post });
}

export async function updatePost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const post = await contentService.updatePost(req.params.id as string, creatorProfileId, req.body);
  await contentService.logPostActivity(post.id, req.user!.userId, 'EDITED', 'Post updated', { updatedFields: Object.keys(req.body) });
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

  const [posts, notes] = await Promise.all([
    contentService.getCalendar(creatorProfileId, month, year),
    contentService.getCalendarNotes(creatorProfileId, month, year),
  ]);

  res.json({ success: true, data: { posts, notes } });
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

// ─── Autosave ───────────────────────────────────────────────

export async function autosavePost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const postId = req.body.postId as string | undefined;
  const post = await contentService.autosavePost(creatorProfileId, postId, req.body);
  res.json({ success: true, data: post });
}

// ─── Search ─────────────────────────────────────────────────

export async function searchContent(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const query = (req.query.q as string) || '';
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  if (!query.trim()) {
    res.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    return;
  }

  const { posts, total } = await contentService.searchContent(creatorProfileId, query, page, limit);
  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── Queue Operations ───────────────────────────────────────

// ─── Get Single Post Detail ─────────────────────────────────

export async function getPost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const post = await contentService.getPostById(req.params.id as string, creatorProfileId);
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }
  res.json({ success: true, data: post });
}

// ─── List Posts ─────────────────────────────────────────────

export async function listPosts(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const platform = req.query.platform as string | undefined;
  const status = req.query.status as string | undefined;
  const postType = req.query.postType as string | undefined;
  const search = req.query.search as string | undefined;

  const { posts, total } = await contentService.listPosts(creatorProfileId, {
    page, limit,
    platform: platform as any,
    status: status as any,
    postType: postType as any,
    search,
  });

  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── Cross-platform Group ───────────────────────────────────

export async function getCrossplatformGroup(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const bulkGroupId = req.params.groupId as string;
  const posts = await contentService.getCrossplatformGroup(bulkGroupId, creatorProfileId);
  res.json({ success: true, data: posts });
}

// ─── Activity Log ───────────────────────────────────────────

export async function getPostActivity(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const { logs, total } = await contentService.getPostActivity(req.params.id as string, page, limit);
  res.json({
    success: true,
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── Queue Operations (continued) ───────────────────────────

export async function shuffleQueue(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const platform = req.body.platform as Platform;
  const posts = await contentService.shuffleQueue(creatorProfileId, platform);
  res.json({ success: true, data: posts });
}

export async function injectIntoQueue(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { postId, position } = req.body;
  const result = await contentService.injectIntoQueue(creatorProfileId, postId, position);
  res.json({ success: true, data: result });
}

// ─── Threads ────────────────────────────────────────────────

export async function createThread(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const thread = await contentService.createThread(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: thread });
}

export async function getThread(req: AuthRequest, res: Response) {
  const thread = await contentService.getThread(req.params.id as string);
  res.json({ success: true, data: thread });
}

// ─── Calendar Notes ─────────────────────────────────────────

export async function createCalendarNote(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const note = await contentService.createCalendarNote(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: note });
}

export async function updateCalendarNote(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const note = await contentService.updateCalendarNote(req.params.id as string, creatorProfileId, req.body);
  res.json({ success: true, data: note });
}

export async function deleteCalendarNote(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  await contentService.deleteCalendarNote(req.params.id as string, creatorProfileId);
  res.json({ success: true, message: 'Note deleted' });
}

// ─── Templates ──────────────────────────────────────────────

export async function getTemplates(req: AuthRequest, res: Response) {
  const platform = req.query.platform as Platform | undefined;
  const templates = await contentService.getTemplates(req.user!.userId, platform);
  res.json({ success: true, data: templates });
}

export async function createTemplate(req: AuthRequest, res: Response) {
  const template = await contentService.createTemplate(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: template });
}

export async function deleteTemplate(req: AuthRequest, res: Response) {
  await contentService.deleteTemplate(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Template deleted' });
}

// ─── Instagram Grid Planner (Phase 11) ──────────────────────

export async function getGridPreview(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const accountId = req.params.accountId as string;
  const limit = Number(req.query.limit) || 18;
  const posts = await contentService.getGridPreview(creatorProfileId, accountId, limit);
  res.json({ success: true, data: posts });
}

export async function reorderScheduledPosts(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { postIds } = req.body as { postIds: string[] };
  const result = await contentService.reorderScheduledPosts(creatorProfileId, postIds);
  res.json({ success: true, data: result });
}

export async function bulkUpdatePosts(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { postIds, action, status } = req.body as { postIds: string[]; action: 'delete' | 'status'; status?: string };
  if (!postIds?.length || !action) {
    res.status(400).json({ success: false, error: 'postIds and action are required' });
    return;
  }
  const result = await contentService.bulkUpdatePosts(creatorProfileId, postIds, action, status);
  res.json({ success: true, data: result });
}

export async function reschedulePost(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const { scheduledAt } = req.body as { scheduledAt: string };
  if (!scheduledAt) {
    res.status(400).json({ success: false, error: 'scheduledAt is required' });
    return;
  }
  const result = await contentService.reschedulePost(req.params.id as string, creatorProfileId, new Date(scheduledAt));
  res.json({ success: true, data: result });
}
