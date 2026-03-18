import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import campaignRoutes from './campaign.routes.js';
import agentRoutes from './agent.routes.js';
import matchingRoutes from './matching.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', contentRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/agents', agentRoutes);
router.use('/matching', matchingRoutes);

export default router;
