import { Router } from 'express';
import { z } from 'zod';
import * as contentController from '../controllers/content.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const createPostSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  postType: z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT']),
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(['IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED']).optional(),
});

const updatePostSchema = z.object({
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(['IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED']).optional(),
});

router.post('/', authenticate, authorize(Role.CREATOR), validate(createPostSchema), contentController.createPost);
router.put('/:id', authenticate, authorize(Role.CREATOR), validate(updatePostSchema), contentController.updatePost);
router.delete('/:id', authenticate, authorize(Role.CREATOR), contentController.deletePost);
router.get('/calendar', authenticate, authorize(Role.CREATOR), contentController.getCalendar);
router.get('/status/:status', authenticate, authorize(Role.CREATOR), contentController.getPostsByStatus);

export default router;
