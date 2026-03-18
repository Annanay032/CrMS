import type { Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const stats = await dashboardService.getDashboardStats(req.user!.userId, req.user!.role);
  if (!stats) {
    res.json({ success: true, data: getEmptyStats(req.user!.role) });
    return;
  }
  res.json({ success: true, data: stats });
}

function getEmptyStats(role: string) {
  if (role === 'CREATOR') {
    return {
      totalFollowers: 0, avgEngagement: 0, scheduledPosts: 0,
      activeCampaigns: 0, pendingInteractions: 0, growthRate: 0,
      recentPosts: [], platformStats: [], snapshots: [],
    };
  }
  if (role === 'BRAND') {
    return {
      activeCampaigns: 0, totalCampaigns: 0, totalMatches: 0,
      acceptedMatches: 0, avgMatchScore: 0, recentCampaigns: [],
    };
  }
  return {};
}

export async function getAnalyticsDashboard(req: AuthRequest, res: Response) {
  const profile = await prisma.creatorProfile.upsert({
    where: { userId: req.user!.userId },
    update: {},
    create: { userId: req.user!.userId, niche: [], languages: ['en'] },
  });
  const period = (req.query.period as 'week' | 'month' | 'quarter') || 'week';
  const data = await dashboardService.getAnalyticsDashboard(profile.id, period);
  res.json({ success: true, data });
}
