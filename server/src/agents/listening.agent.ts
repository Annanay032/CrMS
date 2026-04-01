import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type ListeningAction = 'analyze_mentions' | 'detect_crisis' | 'summarize' | 'sentiment_breakdown' | 'analyze_intent';

export class SocialListeningAgent extends BaseAgent {
  readonly agentType = AgentType.LISTENING;
  readonly name = 'SocialListening';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as ListeningAction) || 'analyze_mentions';

    switch (action) {
      case 'detect_crisis':
        return this.detectCrisis(input);
      case 'summarize':
        return this.generateSummary(input);
      case 'sentiment_breakdown':
        return this.sentimentBreakdown(input);
      case 'analyze_intent':
        return this.analyzeIntent(input);
      default:
        return this.analyzeMentions(input);
    }
  }

  private async analyzeMentions(input: AgentInput): Promise<AgentResult> {
    const { mentions, keywords } = input as {
      mentions: Array<{ content: string; source?: string; platform: string }>;
      keywords: string[];
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social listening analyst. Analyze brand mentions and classify them by sentiment, intent, and priority. Return JSON.`,
        },
        {
          role: 'user',
          content: `Analyze these mentions related to keywords [${keywords.join(', ')}]:

${mentions.map((m, i) => `${i + 1}. [${m.platform}] ${m.source ?? 'unknown'}: "${m.content}"`).join('\n')}

For each mention provide: index, sentiment (POSITIVE/NEGATIVE/NEUTRAL/MIXED), intent (feedback/question/complaint/praise/mention), priority (high/medium/low), suggestedResponse (brief). Also provide "summary" with overall sentiment distribution and key themes. Return JSON with "analyzed" array and "summary" object.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"analyzed":[],"summary":{}}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async detectCrisis(input: AgentInput): Promise<AgentResult> {
    const { mentions, normalVolume, currentVolume, keywords } = input as {
      mentions: Array<{ content: string; sentiment: string; platform: string }>;
      normalVolume: number;
      currentVolume: number;
      keywords: string[];
    };

    const volumeSpike = normalVolume > 0 ? currentVolume / normalVolume : 1;
    const negativeRatio = mentions.filter((m) => m.sentiment === 'NEGATIVE').length / (mentions.length || 1);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a crisis detection specialist for social media. Analyze mention patterns to determine if a crisis is developing. Volume spike: ${volumeSpike.toFixed(1)}x normal. Negative ratio: ${(negativeRatio * 100).toFixed(0)}%. Return JSON.`,
        },
        {
          role: 'user',
          content: `Keywords monitored: [${keywords.join(', ')}]
Volume: ${currentVolume} mentions (${volumeSpike.toFixed(1)}x normal baseline of ${normalVolume})
Recent negative mentions:
${mentions.filter((m) => m.sentiment === 'NEGATIVE').slice(0, 10).map((m) => `- [${m.platform}] "${m.content}"`).join('\n')}

Assess: isCrisis (boolean), severity (none/low/medium/high/critical), category (PR/product/service/controversy/misinformation), description, recommendedActions (array of steps), estimatedImpact. Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content ?? '{"isCrisis":false}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async generateSummary(input: AgentInput): Promise<AgentResult> {
    const { sentimentData, period, keywords, totalMentions } = input as {
      sentimentData: { positive: number; negative: number; neutral: number; mixed: number };
      period: string;
      keywords: string[];
      totalMentions: number;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media listening report writer. Generate an executive summary of brand mention activity. Return JSON.`,
        },
        {
          role: 'user',
          content: `Listening report for keywords [${keywords.join(', ')}] over ${period}:
- Total mentions: ${totalMentions}
- Positive: ${sentimentData.positive} (${totalMentions > 0 ? ((sentimentData.positive / totalMentions) * 100).toFixed(1) : 0}%)
- Negative: ${sentimentData.negative} (${totalMentions > 0 ? ((sentimentData.negative / totalMentions) * 100).toFixed(1) : 0}%)
- Neutral: ${sentimentData.neutral}
- Mixed: ${sentimentData.mixed}

Generate: headline (one sentence), summary (2-3 sentences), keyTakeaways (array of 3-5), sentimentTrend (improving/stable/declining), recommendations (array of actions). Return JSON.`,
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

  private async sentimentBreakdown(input: AgentInput): Promise<AgentResult> {
    const { mentions } = input as {
      mentions: Array<{ content: string; platform: string; source?: string }>;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Classify each mention and identify themes. Return JSON.`,
        },
        {
          role: 'user',
          content: `Classify sentiment for each mention:
${mentions.map((m, i) => `${i + 1}. [${m.platform}] "${m.content}"`).join('\n')}

Return JSON with "results" array (index, sentiment: POSITIVE/NEGATIVE/NEUTRAL/MIXED, confidence: 0-1, themes: string[]) and "themes" object mapping theme names to counts.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content ?? '{"results":[],"themes":{}}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async analyzeIntent(input: AgentInput): Promise<AgentResult> {
    const { mentions } = input as {
      mentions: Array<{ id: string; content: string; platform: string; source?: string; authorFollowers?: number }>;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI that classifies social media messages for a creator's Signal Engine. Analyze each message and determine intent, urgency, and business opportunity. Return JSON.`,
        },
        {
          role: 'user',
          content: `Analyze the following social media mentions and classify each one:

${mentions.map((m, i) => `${i + 1}. [${m.platform}] @${m.source ?? 'unknown'} (${m.authorFollowers ?? 0} followers): "${m.content}"`).join('\n')}

For each mention return:
- index (0-based)
- intent: one of BUYING, QUESTION, COMPLAINT, PRAISE, COLLAB, OTHER
- sentiment: POSITIVE, NEGATIVE, NEUTRAL, or MIXED
- urgencyScore: 0-100 (how time-sensitive is this)
- influenceScore: 0-100 (based on follower count and message quality)
- opportunityScore: 0-100 (overall business opportunity value)
- reason: one sentence explaining the classification
- suggestedAction: brief recommended response action

Return JSON with "results" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content ?? '{"results":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
