import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type TrendAction = 'detect' | 'correlate' | 'score_opportunity' | 'auto_draft';

export class TrendDetectionAgent extends BaseAgent {
  readonly agentType = AgentType.TREND_DETECTION;
  readonly name = 'TrendDetection';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as TrendAction) || 'detect';

    switch (action) {
      case 'correlate':
        return this.correlateAcrossPlatforms(input);
      case 'score_opportunity':
        return this.scoreOpportunity(input);
      case 'auto_draft':
        return this.autoDraftFromTrend(input);
      default:
        return this.detectTrends(input);
    }
  }

  private async detectTrends(input: AgentInput): Promise<AgentResult> {
    const { niche, platforms, region } = input as {
      niche: string[];
      platforms: string[];
      region?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media trend analyst specializing in real-time trend detection across Instagram, YouTube, and TikTok. You identify trending topics, audio/sounds, formats, challenges, and content styles that are currently gaining traction.${region ? ` Focus on the ${region} market.` : ''}`,
        },
        {
          role: 'user',
          content: `Identify current trending content opportunities for a creator in the ${niche.join(', ')} niche on ${platforms.join(', ')}. For each trend provide:
- title: trend name
- platform: which platform(s)
- category: "audio" | "topic" | "format" | "challenge" | "hashtag"
- description: what it is
- relevanceScore: 0-100 how relevant to the niche
- urgency: "act-now" | "this-week" | "emerging"
- contentIdea: a specific post/video idea using this trend
- estimatedReach: "low" | "medium" | "high" | "viral"

Return JSON with "trends" array (max 10) sorted by relevance, and "summary" string with overall trend landscape overview.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{"trends":[],"summary":""}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async correlateAcrossPlatforms(input: AgentInput): Promise<AgentResult> {
    const { trends } = input as {
      trends: Array<{ title: string; platform: string | string[]; category: string; relevanceScore: number }>;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a cross-platform trend analyst. Find patterns and correlations between trends on different platforms. Identify which trends are spreading cross-platform and which are platform-specific. Return JSON.`,
        },
        {
          role: 'user',
          content: `Analyze these trends for cross-platform correlation:
${trends.map((t, i) => `${i + 1}. "${t.title}" on ${Array.isArray(t.platform) ? t.platform.join('/') : t.platform} (${t.category}, relevance: ${t.relevanceScore})`).join('\n')}

Identify: crossPlatformTrends (trends appearing on 2+ platforms, with platformPresence array), platformSpecific (trends unique to one platform), emergingCrossovers (trends likely to spread), correlationInsights (patterns you notice), recommendedFocus (top 3 trends to prioritize and why). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async scoreOpportunity(input: AgentInput): Promise<AgentResult> {
    const { trend, creatorNiche, creatorPlatforms, creatorFollowers, pastPerformance } = input as {
      trend: { title: string; platform: string; category: string; description: string };
      creatorNiche: string[];
      creatorPlatforms: string[];
      creatorFollowers: number;
      pastPerformance?: { avgEngagement: number; avgReach: number };
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a content opportunity scorer. Evaluate whether a specific trend is worth pursuing for a creator based on relevance, timing, effort, and expected return. Return JSON.`,
        },
        {
          role: 'user',
          content: `Score this opportunity:
Trend: "${trend.title}" (${trend.category}) on ${trend.platform}
Description: ${trend.description}

Creator profile:
- Niche: ${creatorNiche.join(', ')}
- Platforms: ${creatorPlatforms.join(', ')}
- Followers: ${creatorFollowers}
${pastPerformance ? `- Avg engagement: ${pastPerformance.avgEngagement}, Avg reach: ${pastPerformance.avgReach}` : ''}

Score: overallScore (0-100), relevanceScore (0-100), timingScore (0-100 — is it too late?), effortLevel (low/medium/high), expectedROI (low/medium/high/very-high), riskLevel (low/medium/high), recommendation (pursue/consider/skip), reasoning (2-3 sentences), suggestedApproach (how to execute). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async autoDraftFromTrend(input: AgentInput): Promise<AgentResult> {
    const { trend, platform, creatorNiche, tone } = input as {
      trend: { title: string; category: string; description: string; contentIdea?: string };
      platform: string;
      creatorNiche: string[];
      tone?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a content creation specialist. Generate a ready-to-post draft based on a trending topic. Adapt the content to the creator's niche and voice${tone ? ` (tone: ${tone})` : ''}. Platform: ${platform}. Return JSON.`,
        },
        {
          role: 'user',
          content: `Create a post draft based on this trend:
Trend: "${trend.title}" — ${trend.description}
${trend.contentIdea ? `Suggested approach: ${trend.contentIdea}` : ''}
Creator niche: ${creatorNiche.join(', ')}

Generate: caption (platform-optimized), hashtags (array, platform-appropriate count), postType (best format: IMAGE/VIDEO/REEL/CAROUSEL/SHORT/THREAD), hook (attention-grabbing first line), callToAction, firstComment (optional engagement booster), mediaDescription (what visual/video content to create). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
