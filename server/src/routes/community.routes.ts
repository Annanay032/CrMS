import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();

router.get('/', authenticate, authorize(Role.CREATOR), communityController.getInteractions);
router.get('/stats', authenticate, authorize(Role.CREATOR), communityController.getStats);
router.post('/:id/responded', authenticate, authorize(Role.CREATOR), communityController.markResponded);

export default router;
