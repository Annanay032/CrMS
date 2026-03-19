import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { authenticateApiKey, requireScope, generateApiKey } from '../middleware/api-key.js';
import { validate } from '../middleware/validate.js';
import * as contentService from '../services/content.service.js';
import type { AuthRequest } from '../types/common.js';
import type { Response } from 'express';

const router = Router();

// ─── API Key Management (requires JWT auth) ─────────────────

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['read', 'write', 'publish'])).min(1).optional(),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

router.post('/keys', authenticate, validate(createKeySchema), async (req: AuthRequest, res: Response) => {
  const { rawKey, keyHash, keyPrefix } = generateApiKey();
  const expiresAt = req.body.expiresInDays
    ? new Date(Date.now() + req.body.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: req.user!.userId,
      name: req.body.name,
      keyHash,
      keyPrefix,
      scopes: req.body.scopes ?? ['read'],
      expiresAt,
    },
  });

  // Return the raw key only once — it cannot be retrieved later
  res.status(201).json({
    success: true,
    data: {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
  });
});

router.get('/keys', authenticate, async (req: AuthRequest, res: Response) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: keys });
});

router.delete('/keys/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.apiKey.delete({
    where: { id: req.params.id as string, userId: req.user!.userId },
  });
  res.json({ success: true, message: 'API key revoked' });
});

// ─── Public API Endpoints (authenticated via API key) ───────

// GET /api/v1/public/posts — List posts
router.get('/posts', authenticateApiKey, requireScope('read'), async (req: AuthRequest, res: Response) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }

  const status = (req.query.status as any) ?? 'PUBLISHED';
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const { posts, total } = await contentService.getPostsByStatus(profile.id, status, page, limit);
  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/v1/public/posts — Create a post via API
router.post('/posts', authenticateApiKey, requireScope('write'), async (req: AuthRequest, res: Response) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }

  const post = await contentService.createPost(profile.id, req.body);
  res.status(201).json({ success: true, data: post });
});

// GET /api/v1/public/posts/:id — Get single post
router.get('/posts/:id', authenticateApiKey, requireScope('read'), async (req: AuthRequest, res: Response) => {
  const post = await prisma.contentPost.findUnique({
    where: { id: req.params.id as string },
    include: { analytics: true },
  });

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }

  // Verify ownership
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (post.creatorProfileId !== profile?.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  res.json({ success: true, data: post });
});

// GET /api/v1/public/analytics — Get post analytics
router.get('/analytics', authenticateApiKey, requireScope('read'), async (req: AuthRequest, res: Response) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }

  const analytics = await prisma.postAnalytics.findMany({
    where: {
      post: { creatorProfileId: profile.id },
    },
    include: {
      post: { select: { id: true, caption: true, platform: true, publishedAt: true } },
    },
    orderBy: { fetchedAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 50, 100),
  });

  res.json({ success: true, data: analytics });
});

export default router;
