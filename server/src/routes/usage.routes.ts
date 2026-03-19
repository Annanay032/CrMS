import { Router } from 'express';
import * as ctrl from '../controllers/usage.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, ctrl.getUsageSummary);
router.get('/history', authenticate, ctrl.getUsageHistory);

export default router;
