import { prisma } from '../config/index.js';
import type { ReportFormat, ReportStatus, Platform } from '@prisma/client';
import { paginate } from '../utils/helpers.js';

/* ── Report CRUD ───────────────────────────────────────── */

export async function getReports(userId: string, page: number, limit: number, filters?: {
  status?: string;
  format?: string;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { userId };
  if (filters?.status) where.status = filters.status;
  if (filters?.format) where.format = filters.format;

  const [reports, total] = await Promise.all([
    prisma.analyticsReport.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.analyticsReport.count({ where }),
  ]);

  return { reports, total };
}

export async function getReportById(id: string, userId: string) {
  return prisma.analyticsReport.findFirst({ where: { id, userId } });
}

export async function createReport(userId: string, data: {
  title: string;
  description?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  metrics: string[];
  platforms?: string[];
  format?: string;
  schedule?: string;
  creatorProfileId?: string;
  brandLogo?: string;
  brandColor?: string;
  brandName?: string;
  footerText?: string;
  isWhiteLabel?: boolean;
}) {
  return prisma.analyticsReport.create({
    data: {
      userId,
      creatorProfileId: data.creatorProfileId,
      title: data.title,
      description: data.description,
      dateRangeStart: new Date(data.dateRangeStart),
      dateRangeEnd: new Date(data.dateRangeEnd),
      metrics: data.metrics,
      platforms: (data.platforms ?? []) as Platform[],
      format: (data.format ?? 'PDF') as ReportFormat,
      status: data.schedule ? 'SCHEDULED' as ReportStatus : 'DRAFT' as ReportStatus,
      schedule: data.schedule,
      brandLogo: data.brandLogo,
      brandColor: data.brandColor,
      brandName: data.brandName,
      footerText: data.footerText,
      isWhiteLabel: data.isWhiteLabel ?? false,
    },
  });
}

export async function updateReport(id: string, userId: string, data: {
  title?: string;
  description?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  metrics?: string[];
  platforms?: string[];
  format?: string;
  schedule?: string;
  brandLogo?: string;
  brandColor?: string;
  brandName?: string;
  footerText?: string;
  isWhiteLabel?: boolean;
}) {
  const update: Record<string, unknown> = {};
  if (data.title) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.dateRangeStart) update.dateRangeStart = new Date(data.dateRangeStart);
  if (data.dateRangeEnd) update.dateRangeEnd = new Date(data.dateRangeEnd);
  if (data.metrics) update.metrics = data.metrics;
  if (data.platforms) update.platforms = data.platforms as Platform[];
  if (data.format) update.format = data.format as ReportFormat;
  if (data.schedule !== undefined) update.schedule = data.schedule;
  if (data.brandLogo !== undefined) update.brandLogo = data.brandLogo;
  if (data.brandColor !== undefined) update.brandColor = data.brandColor;
  if (data.brandName !== undefined) update.brandName = data.brandName;
  if (data.footerText !== undefined) update.footerText = data.footerText;
  if (data.isWhiteLabel !== undefined) update.isWhiteLabel = data.isWhiteLabel;

  return prisma.analyticsReport.update({ where: { id, userId }, data: update });
}

export async function deleteReport(id: string, userId: string) {
  return prisma.analyticsReport.delete({ where: { id, userId } });
}

export async function markReportGenerating(id: string) {
  return prisma.analyticsReport.update({ where: { id }, data: { status: 'GENERATING' as ReportStatus } });
}

export async function markReportFailed(id: string) {
  return prisma.analyticsReport.update({ where: { id }, data: { status: 'FAILED' as ReportStatus } });
}

/* ── Audience Insights ────────────────────────────────── */

export async function getAudienceInsights(creatorProfileId: string, platform?: string) {
  const where: Record<string, unknown> = { creatorProfileId };
  if (platform) where.platform = platform;

  return prisma.audienceInsight.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 30,
  });
}

export async function upsertAudienceInsight(creatorProfileId: string, data: {
  platform: string;
  date: string;
  demographics: Record<string, unknown>;
  activeHours: Record<string, number>;
  topCountries: Record<string, number>;
  topCities: Record<string, number>;
  interests: string[];
}) {
  const dateObj = new Date(data.date);
  dateObj.setHours(0, 0, 0, 0);

  return prisma.audienceInsight.upsert({
    where: {
      creatorProfileId_platform_date: {
        creatorProfileId,
        platform: data.platform as Platform,
        date: dateObj,
      },
    },
    update: {
      demographics: data.demographics as never,
      activeHours: data.activeHours as never,
      topCountries: data.topCountries as never,
      topCities: data.topCities as never,
      interests: data.interests,
    },
    create: {
      creatorProfileId,
      platform: data.platform as Platform,
      date: dateObj,
      demographics: data.demographics as never,
      activeHours: data.activeHours as never,
      topCountries: data.topCountries as never,
      topCities: data.topCities as never,
      interests: data.interests,
    },
  });
}

/* ── Content Type Stats ───────────────────────────────── */

export async function getContentTypeStats(creatorProfileId: string, period: string) {
  const daysBack = period === 'quarter' ? 90 : period === 'month' ? 30 : period === 'year' ? 365 : 7;
  const since = new Date(Date.now() - daysBack * 86_400_000);

  const posts = await prisma.contentPost.findMany({
    where: { creatorProfileId, status: 'PUBLISHED', publishedAt: { gte: since } },
    include: { analytics: true },
  });

  const byType: Record<string, { count: number; totalReach: number; totalEngagement: number; avgEngRate: number }> = {};
  const byPlatform: Record<string, { count: number; totalReach: number; totalEngagement: number }> = {};

  for (const p of posts) {
    const a = p.analytics;
    const eng = (a?.likes ?? 0) + (a?.comments ?? 0) + (a?.shares ?? 0);
    const reach = a?.reach ?? 0;
    const engRate = reach > 0 ? (eng / reach) * 100 : 0;

    const t = p.postType;
    if (!byType[t]) byType[t] = { count: 0, totalReach: 0, totalEngagement: 0, avgEngRate: 0 };
    byType[t].count++;
    byType[t].totalReach += reach;
    byType[t].totalEngagement += eng;
    byType[t].avgEngRate += engRate;

    const pl = p.platform;
    if (!byPlatform[pl]) byPlatform[pl] = { count: 0, totalReach: 0, totalEngagement: 0 };
    byPlatform[pl].count++;
    byPlatform[pl].totalReach += reach;
    byPlatform[pl].totalEngagement += eng;
  }

  for (const k of Object.keys(byType)) {
    if (byType[k].count > 0) byType[k].avgEngRate = Math.round((byType[k].avgEngRate / byType[k].count) * 100) / 100;
  }

  return { byType, byPlatform, totalPosts: posts.length };
}

/* ── Scheduled Reports (for BullMQ) ───────────────────── */

export async function getScheduledReports() {
  return prisma.analyticsReport.findMany({
    where: { status: 'SCHEDULED', schedule: { not: null } },
  });
}
