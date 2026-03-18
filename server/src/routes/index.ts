import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import campaignRoutes from './campaign.routes.js';
import agentRoutes from './agent.routes.js';
import matchingRoutes from './matching.routes.js';
import communityRoutes from './community.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import accountRoutes from './account.routes.js';
import ideaRoutes from './idea.routes.js';
import listeningRoutes from './listening.routes.js';
import competitiveRoutes from './competitive.routes.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', contentRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/agents', agentRoutes);
router.use('/matching', matchingRoutes);
router.use('/community', communityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/accounts', accountRoutes);
router.use('/ideas', ideaRoutes);
router.use('/listening', listeningRoutes);
router.use('/competitive', competitiveRoutes);

export default router;
