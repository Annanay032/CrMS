import { Router } from 'express';
import { z } from 'zod';
import * as campaignController from '../controllers/campaign.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  budget: z.number().min(0).optional(),
  targetNiche: z.array(z.string()).min(1),
  targetPlatforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK'])).min(1),
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

router.post('/', authenticate, authorize(Role.BRAND), validate(createCampaignSchema), campaignController.createCampaign);
router.get('/', authenticate, campaignController.listCampaigns);
router.get('/my', authenticate, authorize(Role.CREATOR), campaignController.getCreatorCampaigns);
router.get('/:id', authenticate, campaignController.getCampaign);
router.patch('/:id/status', authenticate, authorize(Role.BRAND), campaignController.updateCampaignStatus);
router.post('/matches/:matchId/respond', authenticate, authorize(Role.CREATOR), campaignController.respondToMatch);

export default router;
