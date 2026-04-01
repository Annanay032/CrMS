import { Router } from 'express';
import { z } from 'zod';
import * as crmController from '../controllers/crm.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

// ─── Contact schemas ─────────────────────────────────────────

const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  handle: z.string().max(200).optional(),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'REDDIT', 'GOOGLE_BUSINESS']).optional(),
  email: z.string().email().optional(),
  type: z.enum(['BRAND', 'FAN', 'CREATOR', 'AGENCY', 'OTHER']).optional(),
  source: z.enum(['DM', 'COMMENT', 'MENTION', 'EMAIL', 'IMPORT', 'MANUAL']).optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  handle: z.string().max(200).optional(),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'REDDIT', 'GOOGLE_BUSINESS']).optional(),
  email: z.string().email().optional(),
  type: z.enum(['BRAND', 'FAN', 'CREATOR', 'AGENCY', 'OTHER']).optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
});

const updateTagsSchema = z.object({
  tags: z.array(z.string().max(50)).max(50),
});

const updateSignalStatusSchema = z.object({
  status: z.enum(['NEW', 'ACTIONED', 'IGNORED']),
});

// ─── Contact routes ──────────────────────────────────────────

router.get('/contacts', crmController.listContacts);
router.post('/contacts', validate(createContactSchema), crmController.createContact);
router.get('/contacts/:id', crmController.getContact);
router.put('/contacts/:id', validate(updateContactSchema), crmController.updateContact);
router.delete('/contacts/:id', crmController.deleteContact);
router.patch('/contacts/:id/tags', validate(updateTagsSchema), crmController.updateContactTags);

// ─── Pipeline ────────────────────────────────────────────────

router.get('/pipeline', crmController.getPipeline);

// ─── Signals ─────────────────────────────────────────────────

router.get('/signals', crmController.listSignals);
router.get('/signals/summary', crmController.getSignalSummary);
router.patch('/signals/:id/status', validate(updateSignalStatusSchema), crmController.updateSignalStatus);

export default router;
