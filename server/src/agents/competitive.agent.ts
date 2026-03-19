import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type CompetitiveAction = 'benchmark' | 'identify_gaps' | 'generate_report' | 'share_of_voice';

export class CompetitiveIntelligenceAgent extends BaseAgent {
  readonly agentType = AgentType.COMPETITIVE;
  readonly name = 'CompetitiveIntelligence';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as CompetitiveAction) || 'benchmark';

    switch (action) {
      case 'identify_gaps':
        return this.identifyGaps(input);
      case 'generate_report':
        return this.generateReport(input);
      case 'share_of_voice':
        return this.shareOfVoice(input);
      default:
        return this.benchmark(input);
    }
  }

  private async benchmark(input: AgentInput): Promise<AgentResult> {
    const { yourStats, competitorStats } = input as {
      yourStats: { platform: string; followers: number; engagementRate: number; postFrequency: number; avgLikes: number; avgComments: number };
      competitorStats: Array<{ name: string; platform: string; followers: number; engagementRate: number; postFrequency: number; avgLikes: number; avgComments: number }>;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a competitive social media analyst. Compare performance metrics between a brand and its competitors. Provide actionable benchmarking insights. Return JSON.`,
        },
        {
          role: 'user',
          content: `Your stats on ${yourStats.platform}:
- Followers: ${yourStats.followers}, Engagement: ${yourStats.engagementRate}%, Post frequency: ${yourStats.postFrequency}/week
- Avg likes: ${yourStats.avgLikes}, Avg comments: ${yourStats.avgComments}

Competitors:
${competitorStats.map((c) => `- ${c.name}: ${c.followers} followers, ${c.engagementRate}% engagement, ${c.postFrequency}/week, avg likes ${c.avgLikes}`).join('\n')}

Generate: overallRanking (your rank among all), metrics (array of {metric, yourValue, avgCompetitor, bestCompetitor, percentile}), strengths (array), weaknesses (array), recommendations (array of actionable steps). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async identifyGaps(input: AgentInput): Promise<AgentResult> {
    const { yourContentTypes, competitorContentTypes, yourHashtags, competitorHashtags, platform } = input as {
      yourContentTypes: string[];
      competitorContentTypes: Array<{ name: string; types: string[] }>;
      yourHashtags: string[];
      competitorHashtags: Array<{ name: string; hashtags: string[] }>;
      platform: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a competitive gap analyst for social media. Identify content gaps and opportunities by comparing content strategies. Platform: ${platform}. Return JSON.`,
        },
        {
          role: 'user',
          content: `Your content types: ${yourContentTypes.join(', ')}
Competitor content types:
${competitorContentTypes.map((c) => `- ${c.name}: ${c.types.join(', ')}`).join('\n')}

Your top hashtags: ${yourHashtags.slice(0, 20).join(', ')}
Competitor hashtags:
${competitorHashtags.map((c) => `- ${c.name}: ${c.hashtags.slice(0, 15).join(', ')}`).join('\n')}

Identify: contentGaps (content types competitors use that you don't), hashtagOpportunities (hashtags competitors use successfully), formatGaps (formats you're missing), uniqueAdvantages (what you do that competitors don't), prioritizedActions (array with action, impact: high/medium/low, effort: high/medium/low). Return JSON.`,
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

  private async generateReport(input: AgentInput): Promise<AgentResult> {
    const { yourProfile, competitors, period } = input as {
      yourProfile: { name: string; platforms: string[]; stats: Record<string, unknown> };
      competitors: Array<{ name: string; stats: Record<string, unknown> }>;
      period: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a competitive intelligence report writer. Generate a comprehensive competitive analysis report. Return JSON.`,
        },
        {
          role: 'user',
          content: `Generate a competitive report for ${period}:

Your profile: ${JSON.stringify(yourProfile)}
Competitors: ${JSON.stringify(competitors)}

Return JSON with: title, executiveSummary (3-4 sentences), sections (array of {title, content, metrics}), keyFindings (top 5), threats (competitive threats), opportunities (gaps to exploit), strategicRecommendations (prioritized actions), overallHealthScore (0-100).`,
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

  private async shareOfVoice(input: AgentInput): Promise<AgentResult> {
    const { yourMentions, competitorMentions, keywords, period } = input as {
      yourMentions: number;
      competitorMentions: Array<{ name: string; count: number }>;
      keywords: string[];
      period: string;
    };

    const totalMentions = yourMentions + competitorMentions.reduce((sum, c) => sum + c.count, 0);
    const yourShare = totalMentions > 0 ? ((yourMentions / totalMentions) * 100).toFixed(1) : '0';

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a share of voice analyst. Calculate and interpret brand share of voice against competitors. Return JSON.`,
        },
        {
          role: 'user',
          content: `Share of voice for keywords [${keywords.join(', ')}] over ${period}:
- You: ${yourMentions} mentions (${yourShare}%)
${competitorMentions.map((c) => `- ${c.name}: ${c.count} mentions (${totalMentions > 0 ? ((c.count / totalMentions) * 100).toFixed(1) : 0}%)`).join('\n')}
- Total market: ${totalMentions}

Return JSON with: shareOfVoice (array of {name, mentions, percentage}), leader, yourRank, trend (growing/stable/declining), insights (array of observations), recommendations (array to increase share). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
