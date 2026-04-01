import { Router } from 'express';
import { z } from 'zod';
import * as ideaController from '../controllers/idea.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

// ─── Idea schemas ───────────────────────────────────────────

const createIdeaSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(5000).optional(),
  status: z.enum(['SPARK', 'DEVELOPING', 'READY', 'ARCHIVED']).optional(),
  stageId: z.string().optional(),
  source: z.string().max(50).optional(),
  mediaUrls: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(5000).optional(),
  status: z.enum(['SPARK', 'DEVELOPING', 'READY', 'ARCHIVED']).optional(),
  stageId: z.string().optional(),
  source: z.string().max(50).optional(),
  mediaUrls: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

// ─── Tag schemas ────────────────────────────────────────────

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// ─── Stage schemas ──────────────────────────────────────────

const createStageSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateStageSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
});

const reorderStagesSchema = z.object({
  stageIds: z.array(z.string()).min(1),
});

// ─── Template schemas ───────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST']).optional(),
  category: z.string().min(1).max(50),
});

// ─── Quick capture (browser extension) ─────────────────────

const quickCaptureSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(5000).optional(),
  sourceUrl: z.string().url().optional(),
  selectedText: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
});

router.post('/quick', authenticate, validate(quickCaptureSchema), ideaController.quickCapture);

// ─── Idea routes ────────────────────────────────────────────

router.get('/', authenticate, authorize(Role.CREATOR), ideaController.getIdeas);
router.get('/:id', authenticate, authorize(Role.CREATOR), ideaController.getIdeaById);
router.post('/', authenticate, authorize(Role.CREATOR), validate(createIdeaSchema), ideaController.createIdea);
router.put('/:id', authenticate, authorize(Role.CREATOR), validate(updateIdeaSchema), ideaController.updateIdea);
router.delete('/:id', authenticate, authorize(Role.CREATOR), ideaController.deleteIdea);

// ─── Tag routes ─────────────────────────────────────────────

router.get('/tags/all', authenticate, authorize(Role.CREATOR), ideaController.getTags);
router.post('/tags', authenticate, authorize(Role.CREATOR), validate(createTagSchema), ideaController.createTag);
router.put('/tags/:id', authenticate, authorize(Role.CREATOR), validate(updateTagSchema), ideaController.updateTag);
router.delete('/tags/:id', authenticate, authorize(Role.CREATOR), ideaController.deleteTag);

// ─── Template routes ────────────────────────────────────────

router.get('/templates/all', authenticate, ideaController.getTemplates);
router.post('/templates', authenticate, validate(createTemplateSchema), ideaController.createTemplate);

// ─── Stage routes ───────────────────────────────────────────

router.get('/stages/all', authenticate, authorize(Role.CREATOR), ideaController.getStages);
router.post('/stages', authenticate, authorize(Role.CREATOR), validate(createStageSchema), ideaController.createStage);
router.put('/stages/reorder', authenticate, authorize(Role.CREATOR), validate(reorderStagesSchema), ideaController.reorderStages);
router.put('/stages/:id', authenticate, authorize(Role.CREATOR), validate(updateStageSchema), ideaController.updateStage);
router.delete('/stages/:id', authenticate, authorize(Role.CREATOR), ideaController.deleteStage);

export default router;
