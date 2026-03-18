import { Router } from 'express';
import { z } from 'zod';
import * as matchingController from '../controllers/matching.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const findCreatorsSchema = z.object({
  campaignId: z.string().min(1),
});

// Brand: trigger matching algorithm for a campaign
router.post(
  '/find-creators',
  authenticate,
  authorize(Role.BRAND, Role.ADMIN),
  validate(findCreatorsSchema),
  matchingController.findCreators,
);

// Get match results for a campaign
router.get(
  '/campaigns/:campaignId/matches',
  authenticate,
  matchingController.getMatchResults,
);

// Discover creators (searchable directory)
router.get(
  '/creators',
  authenticate,
  matchingController.discoverCreators,
);

export default router;
