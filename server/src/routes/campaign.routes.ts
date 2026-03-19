import { Router } from 'express';
import { z } from 'zod';
import * as campaignController from '../controllers/campaign.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const platformEnum = z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST']);

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  budget: z.number().min(0).optional(),
  targetNiche: z.array(z.string()).min(1),
  targetPlatforms: z.array(platformEnum).min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  criteria: z.object({
    nicheWeight: z.number().min(0).max(1).optional(),
    engagementWeight: z.number().min(0).max(1).optional(),
    followerWeight: z.number().min(0).max(1).optional(),
    locationWeight: z.number().min(0).max(1).optional(),
    budgetWeight: z.number().min(0).max(1).optional(),
    languageWeight: z.number().min(0).max(1).optional(),
  }).optional(),
});

const updateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  budget: z.number().min(0).optional(),
  spent: z.number().min(0).optional(),
  timeline: z.unknown().optional(),
  kpis: z.unknown().optional(),
  briefUrl: z.string().url().optional(),
});

const createDeliverableSchema = z.object({
  creatorProfileId: z.string().min(1),
  type: z.enum(['POST', 'STORY', 'REEL', 'VIDEO', 'REVIEW', 'UNBOXING', 'TUTORIAL', 'OTHER']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  platform: platformEnum.optional(),
  dueDate: z.coerce.date().optional(),
  payment: z.number().min(0).optional(),
});

const updateDeliverableSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED']).optional(),
  contentUrl: z.string().url().optional(),
  feedback: z.string().max(2000).optional(),
  submittedAt: z.coerce.date().optional(),
  approvedAt: z.coerce.date().optional(),
});

// ─── Campaign CRUD ───────────────────────────────────────────

router.post('/', authenticate, authorize(Role.BRAND), validate(createCampaignSchema), campaignController.createCampaign);
router.get('/', authenticate, campaignController.listCampaigns);
router.get('/my', authenticate, authorize(Role.CREATOR), campaignController.getCreatorCampaigns);
router.get('/discover', authenticate, campaignController.discoverCreators);
router.get('/:id', authenticate, campaignController.getCampaign);
router.put('/:id', authenticate, authorize(Role.BRAND), validate(updateCampaignSchema), campaignController.updateCampaign);
router.patch('/:id/status', authenticate, authorize(Role.BRAND), campaignController.updateCampaignStatus);
router.patch('/:id/stage', authenticate, authorize(Role.BRAND), campaignController.updateCampaignStage);

// ─── Matches ─────────────────────────────────────────────────

router.post('/matches/:matchId/respond', authenticate, authorize(Role.CREATOR), campaignController.respondToMatch);

// ─── Deliverables ────────────────────────────────────────────

router.get('/:id/deliverables', authenticate, campaignController.getDeliverables);
router.post('/:id/deliverables', authenticate, authorize(Role.BRAND), validate(createDeliverableSchema), campaignController.createDeliverable);
router.put('/:id/deliverables/:deliverableId', authenticate, validate(updateDeliverableSchema), campaignController.updateDeliverable);
router.delete('/:id/deliverables/:deliverableId', authenticate, authorize(Role.BRAND), campaignController.deleteDeliverable);

// ─── Reports ─────────────────────────────────────────────────

router.get('/:id/reports', authenticate, campaignController.getCampaignReports);

export default router;
