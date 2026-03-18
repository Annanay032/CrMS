import { Router } from 'express';
import { z } from 'zod';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Role } from '../types/enums.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const creatorProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  niche: z.array(z.string()).min(1),
  location: z.string().optional(),
  languages: z.array(z.string()).optional(),
  portfolioUrl: z.string().url().optional(),
});

const brandProfileSchema = z.object({
  companyName: z.string().min(1).max(200),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  targetAudience: z.record(z.unknown()).optional(),
  budgetRangeLow: z.number().min(0).optional(),
  budgetRangeHigh: z.number().min(0).optional(),
});

const agencyProfileSchema = z.object({
  agencyName: z.string().min(1).max(200),
  website: z.string().url().optional(),
});

router.put('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.post('/creator-profile', authenticate, authorize(Role.CREATOR), validate(creatorProfileSchema), userController.setupCreatorProfile);
router.post('/brand-profile', authenticate, authorize(Role.BRAND), validate(brandProfileSchema), userController.setupBrandProfile);
router.post('/agency-profile', authenticate, authorize(Role.AGENCY), validate(agencyProfileSchema), userController.setupAgencyProfile);
router.get('/', authenticate, authorize(Role.ADMIN), userController.listUsers);

export default router;
