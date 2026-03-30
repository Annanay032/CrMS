import { Router } from 'express';
import { z } from 'zod';
import * as contentController from '../controllers/content.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const platformEnum = z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'REDDIT']);
const postTypeEnum = z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT', 'THREAD']);
const statusEnum = z.enum(['IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED']);

const createPostSchema = z.object({
  platform: platformEnum,
  postType: postTypeEnum,
  caption: z.string().max(5000).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: statusEnum.optional(),
  firstComment: z.string().max(2200).optional(),
  platformOverrides: z.record(z.string(), z.object({
    caption: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
  })).optional(),
  bulkGroupId: z.string().optional(),
  ideaId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(200).optional(),
  maxRecurrences: z.number().int().positive().optional(),
  repostSourceUrl: z.string().url().optional(),
  repostType: z.enum(['retweet', 'quote', 'boost']).optional(),
});

const updatePostSchema = z.object({
  caption: z.string().max(5000).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: statusEnum.optional(),
  firstComment: z.string().max(2200).optional(),
  platformOverrides: z.record(z.string(), z.object({
    caption: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
  })).optional(),
  thumbnailUrl: z.string().url().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(200).optional(),
  maxRecurrences: z.number().int().positive().optional(),
});

const autosaveSchema = z.object({
  postId: z.string().optional(),
  platform: platformEnum.optional(),
  postType: postTypeEnum.optional(),
  caption: z.string().max(5000).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  thumbnailUrl: z.string().url().optional(),
});

const createThreadSchema = z.object({
  platform: platformEnum,
  parts: z.array(z.object({
    caption: z.string().max(5000),
    mediaUrls: z.array(z.string()).optional(),
  })).min(2).max(25),
  scheduledAt: z.coerce.date().optional(),
  status: statusEnum.optional(),
});

const calendarNoteSchema = z.object({
  date: z.coerce.date(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isAllDay: z.boolean().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().min(1).max(5000),
  platform: platformEnum.optional(),
  category: z.string().min(1).max(50),
});

const shuffleQueueSchema = z.object({
  platform: platformEnum,
});

const injectQueueSchema = z.object({
  postId: z.string(),
  position: z.number().int().min(0),
});

// ── Post CRUD ──
router.post('/', authenticate, authorize(Role.CREATOR), validate(createPostSchema), contentController.createPost);
router.get('/list', authenticate, authorize(Role.CREATOR), contentController.listPosts);
router.get('/calendar', authenticate, authorize(Role.CREATOR), contentController.getCalendar);
router.get('/status/:status', authenticate, authorize(Role.CREATOR), contentController.getPostsByStatus);
router.get('/group/:groupId', authenticate, authorize(Role.CREATOR), contentController.getCrossplatformGroup);
router.get('/:id', authenticate, authorize(Role.CREATOR), contentController.getPost);
router.get('/:id/activity', authenticate, authorize(Role.CREATOR), contentController.getPostActivity);
router.put('/:id', authenticate, authorize(Role.CREATOR), validate(updatePostSchema), contentController.updatePost);
router.delete('/:id', authenticate, authorize(Role.CREATOR), contentController.deletePost);

// ── Autosave ──
router.put('/autosave', authenticate, authorize(Role.CREATOR), validate(autosaveSchema), contentController.autosavePost);

// ── Search ──
router.get('/search', authenticate, authorize(Role.CREATOR), contentController.searchContent);

// ── Queue ──
router.post('/queue/shuffle', authenticate, authorize(Role.CREATOR), validate(shuffleQueueSchema), contentController.shuffleQueue);
router.post('/queue/inject', authenticate, authorize(Role.CREATOR), validate(injectQueueSchema), contentController.injectIntoQueue);

// ── Threads ──
router.post('/threads', authenticate, authorize(Role.CREATOR), validate(createThreadSchema), contentController.createThread);
router.get('/threads/:id', authenticate, authorize(Role.CREATOR), contentController.getThread);

// ── Calendar Notes ──
router.post('/notes', authenticate, authorize(Role.CREATOR), validate(calendarNoteSchema), contentController.createCalendarNote);
router.put('/notes/:id', authenticate, authorize(Role.CREATOR), validate(calendarNoteSchema.partial()), contentController.updateCalendarNote);
router.delete('/notes/:id', authenticate, authorize(Role.CREATOR), contentController.deleteCalendarNote);

// ── Templates ──
router.get('/templates', authenticate, contentController.getTemplates);
router.post('/templates', authenticate, authorize(Role.CREATOR), validate(createTemplateSchema), contentController.createTemplate);
router.delete('/templates/:id', authenticate, authorize(Role.CREATOR), contentController.deleteTemplate);

// ── Instagram Grid Planner (Phase 11) ──
router.get('/grid/:accountId', authenticate, authorize(Role.CREATOR), contentController.getGridPreview);
router.patch('/reorder', authenticate, authorize(Role.CREATOR), contentController.reorderScheduledPosts);

export default router;
