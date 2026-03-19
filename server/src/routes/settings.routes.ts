import { Router } from 'express';
import * as ctrl from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, ctrl.getSettings);
router.patch('/', authenticate, ctrl.updateSettings);

export default router;
