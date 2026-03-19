import { Router } from 'express';
import { z } from 'zod';
import * as rssController from '../controllers/rss.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const createFeedSchema = z.object({
  url: z.string().url().max(2000),
  autoCreateIdeas: z.boolean().optional(),
});

const toggleFeedSchema = z.object({
  isActive: z.boolean(),
});

router.get('/', authenticate, authorize(Role.CREATOR), rssController.getFeeds);
router.post('/', authenticate, authorize(Role.CREATOR), validate(createFeedSchema), rssController.createFeed);
router.delete('/:id', authenticate, authorize(Role.CREATOR), rssController.deleteFeed);
router.patch('/:id/toggle', authenticate, authorize(Role.CREATOR), validate(toggleFeedSchema), rssController.toggleFeed);

export default router;
