import type { Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const stats = await dashboardService.getDashboardStats(req.user!.userId, req.user!.role);
  if (!stats) {
    res.status(404).json({ success: false, error: 'Profile not set up yet' });
    return;
  }
  res.json({ success: true, data: stats });
}

export async function getAnalyticsDashboard(req: AuthRequest, res: Response) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }
  const period = (req.query.period as 'week' | 'month' | 'quarter') || 'week';
  const data = await dashboardService.getAnalyticsDashboard(profile.id, period);
  res.json({ success: true, data });
}
