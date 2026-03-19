import type { Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import * as reportService from '../services/report.service.js';
import * as hashtagService from '../services/hashtag-analytics.service.js';
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
  const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year') || 'week';
  const data = await dashboardService.getAnalyticsDashboard(profile.id, period);
  res.json({ success: true, data });
}

/* ── Content Type Breakdown ────────────────────────────── */

export async function getContentTypeStats(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const period = (req.query.period as string) || 'week';
  const data = await reportService.getContentTypeStats(profile.id, period);
  res.json({ success: true, data });
}

/* ── Reports ───────────────────────────────────────────── */

export async function getReports(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const filters = {
    status: req.query.status as string | undefined,
    format: req.query.format as string | undefined,
  };
  const { reports, total } = await reportService.getReports(req.user!.userId, page, limit, filters);
  res.json({ success: true, data: reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getReportById(req: AuthRequest, res: Response) {
  const report = await reportService.getReportById(req.params.id as string, req.user!.userId);
  if (!report) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
  res.json({ success: true, data: report });
}

export async function createReport(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const body = req.body as {
    title: string; description?: string; dateRangeStart: string; dateRangeEnd: string;
    metrics: string[]; platforms?: string[]; format?: string; schedule?: string;
  };
  const report = await reportService.createReport(req.user!.userId, { ...body, creatorProfileId: profile.id });
  res.status(201).json({ success: true, data: report });
}

export async function updateReport(req: AuthRequest, res: Response) {
  const body = req.body as Record<string, unknown>;
  const report = await reportService.updateReport(req.params.id as string, req.user!.userId, body as never);
  res.json({ success: true, data: report });
}

export async function deleteReport(req: AuthRequest, res: Response) {
  await reportService.deleteReport(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Report deleted' });
}

export async function generateReport(req: AuthRequest, res: Response) {
  const report = await reportService.getReportById(req.params.id as string, req.user!.userId);
  if (!report) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

  await reportService.markReportGenerating(report.id);

  // Trigger async generation via agent — return immediately
  const profile = await getOrCreateProfile(req.user!.userId);
  const { orchestrator } = await import('../agents/orchestrator.js');
  const { AgentType } = await import('../types/enums.js');

  // Don't await — let it generate in the background
  orchestrator.run(AgentType.ANALYTICS, req.user!.userId, {
    action: 'generate_report',
    creatorProfileId: profile.id,
    reportId: report.id,
    metrics: report.metrics,
    dateRangeStart: report.dateRangeStart.toISOString(),
    dateRangeEnd: report.dateRangeEnd.toISOString(),
    platforms: report.platforms,
  }).catch(async () => {
    await reportService.markReportFailed(report.id);
  });

  res.json({ success: true, message: 'Report generation started', data: { id: report.id, status: 'GENERATING' } });
}

/* ── Audience Insights ─────────────────────────────────── */

export async function getAudienceInsights(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const platform = req.query.platform as string | undefined;
  const data = await reportService.getAudienceInsights(profile.id, platform);
  res.json({ success: true, data });
}

/* ── Helper ────────────────────────────────────────────── */

async function getOrCreateProfile(userId: string) {
  return prisma.creatorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, niche: [], languages: ['en'] },
  });
}

/* ── Hashtag Analytics ───────────────────────────────────── */

export async function getHashtagAnalytics(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const platform = req.query.platform as string | undefined;
  const sortBy = (req.query.sortBy as string) || 'totalImpressions';
  const limit = Number(req.query.limit) || 50;

  const data = await hashtagService.getHashtagAnalytics(profile.id, {
    platform: platform as any,
    sortBy: sortBy as any,
    limit,
  });
  res.json({ success: true, data });
}

export async function getTopHashtags(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const limit = Number(req.query.limit) || 10;
  const data = await hashtagService.getTopHashtags(profile.id, limit);
  res.json({ success: true, data });
}

export async function refreshHashtagAnalytics(req: AuthRequest, res: Response) {
  const profile = await getOrCreateProfile(req.user!.userId);
  const count = await hashtagService.aggregateHashtagAnalytics(profile.id);
  res.json({ success: true, data: { hashtagsUpdated: count } });
}
