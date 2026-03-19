import { Router } from 'express';
import { z } from 'zod';
import * as studioController from '../controllers/studio.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const composeSchema = z.object({
  topic: z.string().min(1).max(2000),
  platform: z.string().optional(),
  tone: z.string().optional(),
  postType: z.string().optional(),
});

const rewriteSchema = z.object({
  caption: z.string().min(1).max(10000),
  intent: z.string().min(1).max(500),
  platform: z.string().optional(),
  tone: z.string().optional(),
});

const imageGenSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
});

const suggestMediaSchema = z.object({
  caption: z.string().min(1).max(5000),
  platform: z.string().optional(),
  postType: z.string().optional(),
});

const intelligenceSchema = z.object({
  caption: z.string().min(1).max(10000),
  hashtags: z.string().optional(),
  platform: z.string().optional(),
  postType: z.string().optional(),
});

const videoAnalysisSchema = z.object({
  videoUrl: z.string().url().max(2000),
  platform: z.string().optional(),
});

const createClipSchema = z.object({
  videoUrl: z.string().url().max(2000),
  duration: z.number().min(5).max(180).optional(),
  style: z.string().optional(),
});

// AI compose — full post draft from topic
router.post('/compose', authenticate, validate(composeSchema), studioController.compose);

// AI rewrite — rewrite caption with intent
router.post('/rewrite', authenticate, validate(rewriteSchema), studioController.rewrite);

// Image generation — DALL-E
router.post('/image/generate', authenticate, validate(imageGenSchema), studioController.generateImage);

// Media suggestions
router.post('/media/suggest', authenticate, validate(suggestMediaSchema), studioController.suggestMedia);

// Integration statuses
router.get('/integrations', authenticate, studioController.integrations);

// Intelligence — best times, hashtags, score, tips
router.post('/intelligence', authenticate, validate(intelligenceSchema), studioController.intelligence);

// Video analysis — retention, rewatch, engagement
router.post('/video/analyze', authenticate, validate(videoAnalysisSchema), studioController.videoAnalysis);

// Create clips / shorts from long-form video
router.post('/video/clip', authenticate, validate(createClipSchema), studioController.createClip);

export default router;
