import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

export class AnalyticsAgent extends BaseAgent {
  readonly agentType = AgentType.ANALYTICS;
  readonly name = 'Analytics';

  async run(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, period } = input as {
      creatorProfileId: string;
      period?: 'week' | 'month' | 'quarter';
    };

    const daysBack = period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Gather recent posts with analytics
    const posts = await prisma.contentPost.findMany({
      where: {
        creatorProfileId,
        status: 'PUBLISHED',
        publishedAt: { gte: since },
      },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
    });

    // Gather snapshots for growth trend
    const snapshots = await prisma.creatorAnalyticsSnapshot.findMany({
      where: { creatorProfileId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    // Gather platform stats
    const platformStats = await prisma.creatorPlatformStats.findMany({
      where: { creatorProfileId },
    });

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
      topPost: posts.sort((a, b) =>
        ((b.analytics?.likes ?? 0) + (b.analytics?.comments ?? 0)) -
        ((a.analytics?.likes ?? 0) + (a.analytics?.comments ?? 0))
      )[0],
      followerGrowth: snapshots.length >= 2
        ? snapshots[snapshots.length - 1].totalFollowers - snapshots[0].totalFollowers
        : 0,
      platformBreakdown: platformStats.map((s) => ({
        platform: s.platform,
        followers: s.followers,
        engagementRate: s.engagementRate,
      })),
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a social media analytics expert. Analyze the performance data and provide actionable insights. Return JSON with "summary" (2-3 sentences), "keyMetrics" (object), "insights" (array of strings), "recommendations" (array of action items), "trend" ("up" | "down" | "stable").',
        },
        {
          role: 'user',
          content: `Analyze this creator's performance over the last ${daysBack} days: ${JSON.stringify(analyticsData)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: { ...parsed, rawMetrics: analyticsData },
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
