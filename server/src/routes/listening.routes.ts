import { Router } from 'express';
import { z } from 'zod';
import * as listeningController from '../controllers/listening.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

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

router.get('/', authenticate, listeningController.getQueries);
router.post('/', authenticate, validate(createQuerySchema), listeningController.createQuery);
router.get('/:id', authenticate, listeningController.getQueryById);
router.put('/:id', authenticate, validate(updateQuerySchema), listeningController.updateQuery);
router.delete('/:id', authenticate, listeningController.deleteQuery);
router.get('/:id/mentions', authenticate, listeningController.getMentions);
router.get('/:id/sentiment/timeline', authenticate, listeningController.getSentimentTimeline);
router.get('/:id/sentiment/summary', authenticate, listeningController.getSentimentSummary);

export default router;
