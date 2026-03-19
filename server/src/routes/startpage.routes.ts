import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/startpage.controller.js';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const createPageSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Slug must be lowercase alphanumeric with optional hyphens'),
  title: z.string().min(1).max(120),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  theme: z.string().max(30).optional(),
  blocks: z.any().optional(),
  customCSS: z.string().max(5000).optional(),
  favicon: z.string().url().optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(300).optional(),
});

const updatePageSchema = createPageSchema.partial();

const addLinkSchema = z.object({
  title: z.string().min(1).max(120),
  url: z.string().url(),
  icon: z.string().max(64).optional(),
  thumbnail: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateLinkSchema = addLinkSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  linkIds: z.array(z.string()).min(1),
});

// ─── Public Routes (no auth) ─────────────────────────────────

router.get('/p/:slug', ctrl.getPublicPage);
router.post('/p/:pageId/links/:linkId/click', ctrl.trackClick);
router.get('/check-slug', ctrl.checkSlug);

// ─── Authenticated Routes ────────────────────────────────────

router.get('/', authenticate, ctrl.getMyPages);
router.post('/', authenticate, validate(createPageSchema), ctrl.createPage);
router.get('/:id', authenticate, ctrl.getPage);
router.put('/:id', authenticate, validate(updatePageSchema), ctrl.updatePage);
router.delete('/:id', authenticate, ctrl.deletePage);

// Links
router.post('/:id/links', authenticate, validate(addLinkSchema), ctrl.addLink);
router.put('/:id/links/:linkId', authenticate, validate(updateLinkSchema), ctrl.updateLink);
router.delete('/:id/links/:linkId', authenticate, ctrl.deleteLink);
router.put('/:id/links/reorder', authenticate, validate(reorderSchema), ctrl.reorderLinks);

// Analytics
router.get('/:id/analytics', authenticate, ctrl.getAnalytics);

export default router;
