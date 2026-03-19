import { Router } from 'express';
import { z } from 'zod';
import * as agentController from '../controllers/agent.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const runAgentSchema = z.object({
  agentType: z.enum([
    'CONTENT_GENERATION', 'SCHEDULING', 'MATCHING',
    'ANALYTICS', 'ENGAGEMENT', 'TREND_DETECTION',
  ]),
  input: z.record(z.unknown()),
});

const contentGenSchema = z.object({
  niche: z.string().min(1),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  tone: z.string().optional(),
  topic: z.string().optional(),
  count: z.number().min(1).max(10).optional(),
});

const scheduleSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  timezone: z.string().optional(),
});

const analyticsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter']).optional(),
});

const engagementSchema = z.object({
  interactionIds: z.array(z.string()).optional(),
  tone: z.string().optional(),
});

const trendSchema = z.object({
  niche: z.array(z.string()).min(1),
  platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK'])).min(1),
  region: z.string().optional(),
});

// Generic agent runner
router.post('/run', authenticate, validate(runAgentSchema), agentController.runAgent);

// Chat: server-side NLP routing with pipeline support
router.post('/chat', authenticate, agentController.chat);

// Specialized endpoints
router.post('/content/generate', authenticate, validate(contentGenSchema), agentController.generateContent);
router.post('/schedule/optimize', authenticate, validate(scheduleSchema), agentController.optimizeSchedule);
router.post('/analytics/insights', authenticate, validate(analyticsSchema), agentController.getAnalyticsInsights);
router.post('/engagement/suggestions', authenticate, validate(engagementSchema), agentController.getEngagementSuggestions);
router.post('/trends', authenticate, validate(trendSchema), agentController.getTrends);

// Agent metadata
router.get('/', authenticate, agentController.listAgents);
router.get('/history', authenticate, agentController.getAgentHistory);

export default router;
