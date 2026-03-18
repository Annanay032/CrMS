import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

type SchedulingAction = 'best_times' | 'auto_fill_queue' | 'suggest_frequency' | 'heatmap';

export class SchedulingAgent extends BaseAgent {
  readonly agentType = AgentType.SCHEDULING;
  readonly name = 'Scheduling';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as SchedulingAction) || 'best_times';

    switch (action) {
      case 'auto_fill_queue':
        return this.autoFillQueue(input);
      case 'suggest_frequency':
        return this.suggestFrequency(input);
      case 'heatmap':
        return this.generateHeatmap(input);
      default:
        return this.bestTimes(input);
    }
  }

  private async getPerformanceData(creatorProfileId: string, platform: string) {
    const recentPosts = await prisma.contentPost.findMany({
      where: { creatorProfileId, platform: platform as any, status: 'PUBLISHED' },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    return recentPosts
      .filter((p) => p.analytics && p.publishedAt)
      .map((p) => ({
        day: p.publishedAt!.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: p.publishedAt!.getHours(),
        engagement: (p.analytics!.likes + p.analytics!.comments + p.analytics!.shares),
        reach: p.analytics!.reach,
        postType: p.postType,
      }));
  }

  private async bestTimes(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platform, timezone } = input as {
      creatorProfileId: string;
      platform: string;
      timezone?: string;
    };

    const performanceData = await this.getPerformanceData(creatorProfileId, platform);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media scheduling optimization expert. Analyze posting performance data and recommend optimal posting times. Consider platform-specific peak hours. Timezone: ${timezone ?? 'UTC'}. Return JSON.`,
        },
        {
          role: 'user',
          content: `Based on this performance data for ${platform}: ${JSON.stringify(performanceData)}

Recommend the top 7 best posting slots for the upcoming week. For each slot provide: day (weekday name), time (HH:MM 24h format), reason (brief), expectedEngagementBoost (percentage). Also provide general insights about the creator's best-performing time patterns. Return as JSON with "slots" array and "insights" string.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '{"slots":[],"insights":""}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async autoFillQueue(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platform, timezone, weekStart, postsPerWeek } = input as {
      creatorProfileId: string;
      platform: string;
      timezone?: string;
      weekStart: string;
      postsPerWeek: number;
    };

    const performanceData = await this.getPerformanceData(creatorProfileId, platform);

    // Fetch existing scheduled posts to avoid conflicts
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const existingScheduled = await prisma.contentPost.findMany({
      where: {
        creatorProfileId,
        platform: platform as any,
        status: 'SCHEDULED',
        scheduledAt: { gte: startDate, lt: endDate },
      },
      select: { scheduledAt: true },
    });

    const blockedSlots = existingScheduled
      .filter((p) => p.scheduledAt)
      .map((p) => p.scheduledAt!.toISOString());

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media scheduling queue manager. Fill a creator's posting queue for the week with optimal time slots, avoiding conflicts with already-scheduled posts. Timezone: ${timezone ?? 'UTC'}. Return JSON.`,
        },
        {
          role: 'user',
          content: `Performance data for ${platform}: ${JSON.stringify(performanceData)}
Week starting: ${weekStart}
Posts needed: ${postsPerWeek}
Already scheduled: ${JSON.stringify(blockedSlots)}

Generate exactly ${postsPerWeek} time slots for this week, spread evenly, at peak engagement times. For each slot: scheduledAt (ISO 8601), day, time, priority (1=best). Return JSON with "queue" array and "strategy" string explaining the distribution.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"queue":[],"strategy":""}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async suggestFrequency(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platforms } = input as {
      creatorProfileId: string;
      platforms: string[];
    };

    // Gather posting frequency and performance across all requested platforms
    const platformStats = await Promise.all(
      platforms.map(async (platform) => {
        const data = await this.getPerformanceData(creatorProfileId, platform);
        const totalPosts = data.length;
        const avgEngagement = totalPosts > 0
          ? data.reduce((sum, p) => sum + p.engagement, 0) / totalPosts
          : 0;
        return { platform, totalPosts, avgEngagement, dataPoints: data.length };
      }),
    );

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media strategy expert. Analyze a creator's posting patterns and recommend ideal posting frequency per platform. Consider platform norms: Instagram (3-5/week), TikTok (1-3/day), YouTube (1-2/week), Twitter (3-5/day), LinkedIn (2-3/week). Return JSON.`,
        },
        {
          role: 'user',
          content: `Creator's platform stats from last 50 posts each: ${JSON.stringify(platformStats)}

For each platform, recommend: postsPerWeek, postsPerDay (if applicable), bestContentMix (object with postType percentages), reasoning. Also provide an overallStrategy string. Return JSON with "platforms" array and "overallStrategy" string.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '{"platforms":[],"overallStrategy":""}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async generateHeatmap(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platform } = input as {
      creatorProfileId: string;
      platform: string;
    };

    const performanceData = await this.getPerformanceData(creatorProfileId, platform);

    // Build a 7x24 heatmap grid from actual data
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const p of performanceData) {
      const dayIdx = days.indexOf(p.day);
      if (dayIdx >= 0) {
        heatmap[dayIdx][p.hour] += p.engagement;
        counts[dayIdx][p.hour]++;
      }
    }

    // Average engagement per slot
    const avgHeatmap = heatmap.map((row, d) =>
      row.map((total, h) => (counts[d][h] > 0 ? Math.round(total / counts[d][h]) : 0)),
    );

    return {
      output: {
        days,
        hours: Array.from({ length: 24 }, (_, i) => i),
        heatmap: avgHeatmap,
        totalDataPoints: performanceData.length,
        platform,
      },
    };
  }
}
