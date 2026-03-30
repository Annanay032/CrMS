import { Router } from 'express';
import * as channelController from '../controllers/channel.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();

// ── Channel Overview ──
router.get('/:platform/overview', authenticate, authorize(Role.CREATOR), channelController.getChannelOverview);

// ── Channel Posts ──
router.get('/:platform/posts', authenticate, authorize(Role.CREATOR), channelController.getChannelPosts);

// ── Channel Analytics ──
router.get('/:platform/analytics', authenticate, authorize(Role.CREATOR), channelController.getChannelAnalytics);

export default router;
