import { Router } from 'express';
import { z } from 'zod';
import * as competitiveController from '../controllers/competitive.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requirePlan } from '../middleware/plan-gate.js';

const router = Router();
router.use(authenticate, requirePlan('ENTERPRISE'));

const createCompetitorSchema = z.object({
  name: z.string().min(1).max(200),
  handles: z.record(z.string(), z.string()),
  platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST'])).min(1),
  notes: z.string().max(1000).optional(),
});

const updateCompetitorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  handles: z.record(z.string(), z.string()).optional(),
  platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST'])).min(1).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

router.get('/', competitiveController.getCompetitors);
router.post('/', validate(createCompetitorSchema), competitiveController.createCompetitor);
router.get('/benchmark', competitiveController.getBenchmark);
router.get('/:id', competitiveController.getCompetitorById);
router.put('/:id', validate(updateCompetitorSchema), competitiveController.updateCompetitor);
router.delete('/:id', competitiveController.deleteCompetitor);
router.get('/:id/snapshots', competitiveController.getSnapshots);

export default router;
