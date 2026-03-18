import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

export class SchedulingAgent extends BaseAgent {
  readonly agentType = AgentType.SCHEDULING;
  readonly name = 'Scheduling';

  async run(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, platform, timezone } = input as {
      creatorProfileId: string;
      platform: string;
      timezone?: string;
    };

    // Fetch creator's recent post analytics
    const recentPosts = await prisma.contentPost.findMany({
      where: { creatorProfileId, platform: platform as any, status: 'PUBLISHED' },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });

    const performanceData = recentPosts
      .filter((p) => p.analytics && p.publishedAt)
      .map((p) => ({
        day: p.publishedAt!.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: p.publishedAt!.getHours(),
        engagement: (p.analytics!.likes + p.analytics!.comments + p.analytics!.shares),
        reach: p.analytics!.reach,
      }));

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
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
