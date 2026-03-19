import { Router } from 'express';
import { z } from 'zod';
import * as listeningController from '../controllers/listening.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requirePlan } from '../middleware/plan-gate.js';

const router = Router();
router.use(authenticate, requirePlan('PRO'));

const createQuerySchema = z.object({
  name: z.string().min(1).max(200),
  keywords: z.array(z.string().min(1)).min(1).max(50),
  platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST'])).min(1),
});

const updateQuerySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  keywords: z.array(z.string().min(1)).min(1).max(50).optional(),
  platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST'])).min(1).optional(),
  isActive: z.boolean().optional(),
});

router.get('/', listeningController.getQueries);
router.post('/', validate(createQuerySchema), listeningController.createQuery);
router.get('/:id', listeningController.getQueryById);
router.put('/:id', validate(updateQuerySchema), listeningController.updateQuery);
router.delete('/:id', listeningController.deleteQuery);
router.get('/:id/mentions', listeningController.getMentions);
router.get('/:id/sentiment/timeline', listeningController.getSentimentTimeline);
router.get('/:id/sentiment/summary', listeningController.getSentimentSummary);

export default router;
