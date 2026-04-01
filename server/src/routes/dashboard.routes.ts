import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Existing
router.get('/stats', authenticate, dashboardController.getDashboardStats);
router.get('/analytics', authenticate, dashboardController.getAnalyticsDashboard);

// Content type breakdown
router.get('/content-types', authenticate, dashboardController.getContentTypeStats);

// Audience insights
router.get('/audience', authenticate, dashboardController.getAudienceInsights);

// Hashtag analytics
router.get('/hashtags', authenticate, dashboardController.getHashtagAnalytics);
router.get('/hashtags/top', authenticate, dashboardController.getTopHashtags);
router.post('/hashtags/refresh', authenticate, dashboardController.refreshHashtagAnalytics);

// Organic vs Boosted
router.get('/organic-vs-boosted', authenticate, dashboardController.getOrganicVsBoosted);

// Per-post analytics
router.get('/posts/:id/analytics', authenticate, dashboardController.getPostAnalytics);

// Reports CRUD
router.get('/reports', authenticate, dashboardController.getReports);
router.post('/reports', authenticate, dashboardController.createReport);
router.get('/reports/:id', authenticate, dashboardController.getReportById);
router.put('/reports/:id', authenticate, dashboardController.updateReport);
router.delete('/reports/:id', authenticate, dashboardController.deleteReport);
router.post('/reports/:id/generate', authenticate, dashboardController.generateReport);

export default router;
