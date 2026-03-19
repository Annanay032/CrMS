import { env } from '../config/env.js';
import { openai, prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';
import { getAllTrendData } from '../services/trends-data.service.js';

type GrowthAction = 'daily' | 'hooks' | 'predict' | 'weekly_plan';

export class GrowthAgent extends BaseAgent {
  readonly agentType = AgentType.GROWTH;
  readonly name = 'GrowthCopilot';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as GrowthAction) || 'daily';

    switch (action) {
      case 'hooks':
        return this.generateHooks(input);
      case 'predict':
        return this.predictVirality(input);
      case 'weekly_plan':
        return this.weeklyGrowthPlan(input);
      default:
        return this.dailyRecommendation(input);
    }
  }

  private async dailyRecommendation(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, niche, platforms } = input as {
      creatorProfileId: string;
      niche: string[];
      platforms: string[];
    };

    // Fetch real trend data + recent performance
    const [trendData, recentPosts] = await Promise.all([
      getAllTrendData(niche),
      prisma.contentPost.findMany({
        where: { creatorProfileId },
        include: { analytics: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
    ]);

    const avgEngagement = recentPosts.reduce((sum, p) => {
      const a = p.analytics;
      return sum + (a ? a.likes + a.comments + a.shares : 0);
    }, 0) / Math.max(recentPosts.length, 1);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a growth strategist for social media creators. Provide ONE actionable daily recommendation grounded in real trend data and the creator's recent performance. Be specific, not generic.`,
        },
        {
          role: 'user',
          content: `Creator niche: ${niche.join(', ')}
Platforms: ${platforms.join(', ')}
Average recent engagement: ${Math.round(avgEngagement)}
Recent post captions: ${recentPosts.map(p => p.caption?.slice(0, 60)).filter(Boolean).join(', ') || 'none'}

Live trend data:
- Google Trends: ${JSON.stringify(trendData.google).slice(0, 600)}
- YouTube Trending: ${JSON.stringify(trendData.youtube.slice(0, 5)).slice(0, 600)}
- TikTok Trending: ${JSON.stringify(trendData.tiktok.slice(0, 10)).slice(0, 400)}
- Instagram Hashtag Volume: ${JSON.stringify(trendData.instagram).slice(0, 300)}

Generate a daily recommendation with: title, description, targetPlatform, contentType, hooks (3 hook alternatives), bestPostingTime (ISO string or time range), estimatedReach ("low"|"medium"|"high"|"viral"), trendReference (which trend this leverages), reasoning (2-3 sentences). Return JSON.`,
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

  private async generateHooks(input: AgentInput): Promise<AgentResult> {
    const { topic, platform, tone, count } = input as {
      topic: string;
      platform: string;
      tone?: string;
      count?: number;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a viral content hook expert. Generate scroll-stopping hooks that drive views, saves, and shares. Each hook should be designed for maximum attention capture in the first 1-3 seconds.`,
        },
        {
          role: 'user',
          content: `Generate ${count || 5} hooks for a ${platform} post about "${topic}".${tone ? ` Tone: ${tone}.` : ''}

For each hook provide: text (the actual hook), type ("question"|"statistic"|"controversy"|"story"|"curiosity_gap"|"bold_claim"), estimatedStrength (0-100), bestForFormat ("reel"|"carousel"|"story"|"post"|"short"), reasoning. Return JSON with "hooks" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content ?? '{"hooks":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async predictVirality(input: AgentInput): Promise<AgentResult> {
    const { title, description, platform, contentType, niche } = input as {
      title: string;
      description?: string;
      platform: string;
      contentType: string;
      niche: string[];
    };

    const trendData = await getAllTrendData(niche);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a virality prediction engine. Score content ideas based on trend alignment, hook quality, content type performance, and niche fit. Ground your analysis in the provided trend data.`,
        },
        {
          role: 'user',
          content: `Predict virality for this content idea:
Title: "${title}"
Description: ${description || 'N/A'}
Platform: ${platform}
Content Type: ${contentType}
Niche: ${niche.join(', ')}

Current trends: ${JSON.stringify({ youtube: trendData.youtube.slice(0, 3), tiktok: trendData.tiktok.slice(0, 5), instagram: trendData.instagram }).slice(0, 800)}

Return JSON with: viralityScore (0-100), confidence (0-100), factors (array of {name, score, impact: "positive"|"negative"|"neutral", detail}), trendAlignment (which current trends it matches), suggestions (array of improvement tips), estimatedReach ("low"|"medium"|"high"|"viral"), bestTimeToPost (time range).`,
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

  private async weeklyGrowthPlan(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, niche, platforms } = input as {
      creatorProfileId: string;
      niche: string[];
      platforms: string[];
    };

    const [trendData, recentPosts, schedule] = await Promise.all([
      getAllTrendData(niche),
      prisma.contentPost.findMany({
        where: { creatorProfileId },
        include: { analytics: true },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      }),
      prisma.postingSchedule.findMany({
        where: { creatorProfileId },
      }),
    ]);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a growth strategist creating a 7-day content plan. Ground it in real trends, past performance, and optimal posting schedule. Each day should have a clear purpose (educate, entertain, engage, promote, etc.).`,
        },
        {
          role: 'user',
          content: `Create a 7-day growth plan for a ${niche.join('/')} creator on ${platforms.join(', ')}.

Recent post performance (last 20):
${recentPosts.slice(0, 10).map(p => `"${p.caption?.slice(0, 60) ?? '(no caption)'}" — ${p.analytics ? `${p.analytics.likes}L/${p.analytics.comments}C/${p.analytics.shares}S` : 'no data'}`).join('\n')}

Current schedule slots: ${schedule.map(s => `${s.platform} ${s.dayOfWeek} ${s.timeSlot}`).join(', ') || 'none set'}

Trend data: ${JSON.stringify({ youtube: trendData.youtube.slice(0, 3), tiktok: trendData.tiktok.slice(0, 5), google: trendData.google.slice(0, 3) }).slice(0, 800)}

Return JSON with: weekGoal (string), days (array of 7 objects with: dayOfWeek, platform, contentType, title, description, hook, trendReference, purpose, bestTime), weeklyMetrics (expected followers growth, engagement rate target), tips (3 bonus growth tips).`,
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
