import { env } from '../config/env.js';
import { prisma, openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

function daysFromPeriod(period?: string): number {
  if (period === 'quarter') return 90;
  if (period === 'month') return 30;
  if (period === 'year') return 365;
  return 7;
}

export class AnalyticsAgent extends BaseAgent {
  readonly agentType = AgentType.ANALYTICS;
  readonly name = 'Analytics';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as string) ?? 'analyze';

    switch (action) {
      case 'analyze':
        return this.analyze(input);
      case 'content_breakdown':
        return this.contentBreakdown(input);
      case 'audience_insights':
        return this.audienceInsights(input);
      case 'forecast_growth':
        return this.forecastGrowth(input);
      case 'generate_report':
        return this.generateReport(input);
      case 'best_performing':
        return this.bestPerforming(input);
      default:
        return this.analyze(input);
    }
  }

  /* ── 1. Analyze (original — cross-channel summary) ───── */
  private async analyze(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, period } = input as { creatorProfileId: string; period?: string };
    const daysBack = daysFromPeriod(period);
    const since = new Date(Date.now() - daysBack * 86_400_000);

    const [posts, snapshots, platformStats] = await Promise.all([
      prisma.contentPost.findMany({
        where: { creatorProfileId, status: 'PUBLISHED', publishedAt: { gte: since } },
        include: { analytics: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.creatorAnalyticsSnapshot.findMany({
        where: { creatorProfileId, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      prisma.creatorPlatformStats.findMany({ where: { creatorProfileId } }),
    ]);

    const analyticsData = {
      postsCount: posts.length,
      totalImpressions: posts.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0),
      totalReach: posts.reduce((s, p) => s + (p.analytics?.reach ?? 0), 0),
      totalLikes: posts.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0),
      totalComments: posts.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0),
      totalShares: posts.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0),
      avgEngagementRate: posts.length > 0
        ? posts.reduce((s, p) => {
            const a = p.analytics;
            if (!a || !a.reach) return s;
            return s + ((a.likes + a.comments + a.shares) / a.reach) * 100;
          }, 0) / posts.length
        : 0,
      followerGrowth: snapshots.length >= 2
        ? snapshots[snapshots.length - 1].totalFollowers - snapshots[0].totalFollowers
        : 0,
      platformBreakdown: platformStats.map((s) => ({
        platform: s.platform, followers: s.followers, engagementRate: s.engagementRate,
      })),
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a social media analytics expert. Analyze the performance data and provide actionable insights. Return JSON with "summary" (2-3 sentences), "keyMetrics" (object), "insights" (array of strings), "recommendations" (array of action items), "trend" ("up"|"down"|"stable").' },
        { role: 'user', content: `Analyze this creator's performance over the last ${daysBack} days: ${JSON.stringify(analyticsData)}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return { output: { ...parsed, rawMetrics: analyticsData }, tokensUsed: response.usage?.total_tokens };
  }

  /* ── 2. Content Type Breakdown ───────────────────────── */
  private async contentBreakdown(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, period } = input as { creatorProfileId: string; period?: string };
    const since = new Date(Date.now() - daysFromPeriod(period) * 86_400_000);

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

      // By content type
      const t = p.postType;
      if (!byType[t]) byType[t] = { count: 0, totalReach: 0, totalEngagement: 0, avgEngRate: 0 };
      byType[t].count++;
      byType[t].totalReach += reach;
      byType[t].totalEngagement += eng;
      byType[t].avgEngRate += engRate;

      // By platform
      const pl = p.platform;
      if (!byPlatform[pl]) byPlatform[pl] = { count: 0, totalReach: 0, totalEngagement: 0 };
      byPlatform[pl].count++;
      byPlatform[pl].totalReach += reach;
      byPlatform[pl].totalEngagement += eng;
    }

    // Normalize avgEngRate
    for (const k of Object.keys(byType)) {
      if (byType[k].count > 0) byType[k].avgEngRate = Math.round((byType[k].avgEngRate / byType[k].count) * 100) / 100;
    }

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a social media content strategist. Analyze content type performance and return JSON with "bestPerformingType" (string), "worstPerformingType" (string), "insights" (array of strings), "recommendations" (array of strings with specific content type advice).' },
        { role: 'user', content: `Content breakdown by type: ${JSON.stringify(byType)}. By platform: ${JSON.stringify(byPlatform)}.` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return { output: { ...parsed, byType, byPlatform }, tokensUsed: response.usage?.total_tokens };
  }

  /* ── 3. Audience Insights ────────────────────────────── */
  private async audienceInsights(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platform } = input as { creatorProfileId: string; platform?: string };

    const where: Record<string, unknown> = { creatorProfileId };
    if (platform) where.platform = platform;

    const insights = await prisma.audienceInsight.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10,
    });

    const platformStats = await prisma.creatorPlatformStats.findMany({ where: { creatorProfileId } });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are an audience analyst. Analyze audience demographics and behavior data. Return JSON with "summary" (string), "keySegments" (array of { name, percentage, description }), "bestPostingTimes" (array of { day, hour, score }), "growthOpportunities" (array of strings), "recommendations" (array of strings).' },
        { role: 'user', content: `Audience data: ${JSON.stringify(insights.map((i) => ({ platform: i.platform, date: i.date, demographics: i.demographics, activeHours: i.activeHours, topCountries: i.topCountries, interests: i.interests })))}. Platform stats: ${JSON.stringify(platformStats.map((s) => ({ platform: s.platform, followers: s.followers, engagementRate: s.engagementRate })))}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return { output: { ...parsed, rawInsights: insights }, tokensUsed: response.usage?.total_tokens };
  }

  /* ── 4. Forecast Growth ──────────────────────────────── */
  private async forecastGrowth(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId } = input as { creatorProfileId: string };

    const snapshots = await prisma.creatorAnalyticsSnapshot.findMany({
      where: { creatorProfileId },
      orderBy: { date: 'asc' },
      take: 90,
    });

    const platformStats = await prisma.creatorPlatformStats.findMany({ where: { creatorProfileId } });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a growth forecasting analyst. Based on historical growth data, project future growth. Return JSON with "currentFollowers" (number), "projectedFollowers30d" (number), "projectedFollowers90d" (number), "growthTrend" ("accelerating"|"steady"|"decelerating"|"declining"), "weeklyGrowthRate" (number as %), "milestoneDate" (string — when they\'ll hit next round number milestone), "factors" (array of strings explaining growth drivers), "recommendations" (array of strings).' },
        { role: 'user', content: `Historical snapshots (last 90 entries): ${JSON.stringify(snapshots.map((s) => ({ date: s.date, followers: s.totalFollowers, engagement: s.totalEngagement, growthRate: s.growthRate })))}. Current platform stats: ${JSON.stringify(platformStats.map((s) => ({ platform: s.platform, followers: s.followers, engagementRate: s.engagementRate })))}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return { output: parsed, tokensUsed: response.usage?.total_tokens };
  }

  /* ── 5. Generate Report Data ─────────────────────────── */
  private async generateReport(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, reportId, metrics, dateRangeStart, dateRangeEnd, platforms } = input as {
      creatorProfileId: string; reportId: string; metrics: string[];
      dateRangeStart: string; dateRangeEnd: string; platforms?: string[];
    };

    const start = new Date(dateRangeStart);
    const end = new Date(dateRangeEnd);
    const where: Record<string, unknown> = { creatorProfileId, status: 'PUBLISHED', publishedAt: { gte: start, lte: end } };
    if (platforms?.length) where.platform = { in: platforms };

    const [posts, snapshots, audienceData] = await Promise.all([
      prisma.contentPost.findMany({ where, include: { analytics: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.creatorAnalyticsSnapshot.findMany({
        where: { creatorProfileId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      prisma.audienceInsight.findMany({
        where: { creatorProfileId, date: { gte: start, lte: end } },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    const reportData: Record<string, unknown> = { period: { start: dateRangeStart, end: dateRangeEnd }, generatedAt: new Date().toISOString() };

    if (metrics.includes('impressions') || metrics.includes('engagement')) {
      reportData.engagementSummary = {
        totalPosts: posts.length,
        totalImpressions: posts.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0),
        totalReach: posts.reduce((s, p) => s + (p.analytics?.reach ?? 0), 0),
        totalLikes: posts.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0),
        totalComments: posts.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0),
        totalShares: posts.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0),
        totalSaves: posts.reduce((s, p) => s + (p.analytics?.saves ?? 0), 0),
      };
    }

    if (metrics.includes('followerGrowth')) {
      reportData.followerGrowth = {
        dataPoints: snapshots.map((s) => ({ date: s.date, followers: s.totalFollowers, growthRate: s.growthRate })),
        netGrowth: snapshots.length >= 2 ? snapshots[snapshots.length - 1].totalFollowers - snapshots[0].totalFollowers : 0,
      };
    }

    if (metrics.includes('audience')) {
      reportData.audience = audienceData.map((a) => ({ platform: a.platform, date: a.date, demographics: a.demographics, topCountries: a.topCountries }));
    }

    if (metrics.includes('contentPerformance')) {
      const topPosts = [...posts].sort((a, b) =>
        ((b.analytics?.likes ?? 0) + (b.analytics?.comments ?? 0)) - ((a.analytics?.likes ?? 0) + (a.analytics?.comments ?? 0))
      ).slice(0, 10);
      reportData.topPosts = topPosts.map((p) => ({ id: p.id, platform: p.platform, postType: p.postType, caption: p.caption?.slice(0, 80), publishedAt: p.publishedAt, analytics: p.analytics }));
    }

    // Use AI to generate executive summary
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a report writer for social media analytics. Generate an executive summary. Return JSON with "executiveSummary" (string, 3-4 sentences), "highlights" (array of strings), "areasForImprovement" (array of strings).' },
        { role: 'user', content: `Report data: ${JSON.stringify(reportData)}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const summary = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    const generatedData = { ...reportData, ...summary };

    // Save generated data to the report
    await prisma.analyticsReport.update({
      where: { id: reportId },
      data: { generatedData: generatedData as never, status: 'READY', lastGeneratedAt: new Date() },
    });

    return { output: generatedData, tokensUsed: response.usage?.total_tokens };
  }

  /* ── 6. Best Performing Content ──────────────────────── */
  private async bestPerforming(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, period, limit: postLimit } = input as { creatorProfileId: string; period?: string; limit?: number };
    const since = new Date(Date.now() - daysFromPeriod(period) * 86_400_000);
    const take = postLimit ?? 10;

    const posts = await prisma.contentPost.findMany({
      where: { creatorProfileId, status: 'PUBLISHED', publishedAt: { gte: since } },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
    });

    // Score each post
    const scored = posts.map((p) => {
      const a = p.analytics;
      const engagement = (a?.likes ?? 0) + (a?.comments ?? 0) * 2 + (a?.shares ?? 0) * 3 + (a?.saves ?? 0) * 2;
      const reach = a?.reach ?? 1;
      const engagementRate = (engagement / reach) * 100;
      return { id: p.id, platform: p.platform, postType: p.postType, caption: p.caption?.slice(0, 80), publishedAt: p.publishedAt, engagement, reach, engagementRate: Math.round(engagementRate * 100) / 100, impressions: a?.impressions ?? 0, videoViews: a?.videoViews ?? 0 };
    }).sort((a, b) => b.engagementRate - a.engagementRate).slice(0, take);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a content performance analyst. Analyze the top performing posts and identify patterns. Return JSON with "patterns" (array of strings — what made these posts perform well), "bestPlatform" (string), "bestContentType" (string), "bestPostingDay" (string), "recommendations" (array of action items to replicate success).' },
        { role: 'user', content: `Top ${take} performing posts: ${JSON.stringify(scored)}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return { output: { ...parsed, topPosts: scored }, tokensUsed: response.usage?.total_tokens };
  }
}
