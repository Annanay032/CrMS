import OpenAI from 'openai';
import { env } from '../config/env.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

export class TrendDetectionAgent extends BaseAgent {
  readonly agentType = AgentType.TREND_DETECTION;
  readonly name = 'TrendDetection';

  async run(input: AgentInput): Promise<AgentResult> {
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
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
