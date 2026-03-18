import OpenAI from 'openai';
import { env } from '../config/env.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

const PLATFORM_LIMITS: Record<string, { captionMax: number; hashtagMax: number }> = {
  INSTAGRAM: { captionMax: 2200, hashtagMax: 30 },
  YOUTUBE: { captionMax: 5000, hashtagMax: 15 },
  TIKTOK: { captionMax: 2200, hashtagMax: 10 },
};

export class ContentGenerationAgent extends BaseAgent {
  readonly agentType = AgentType.CONTENT_GENERATION;
  readonly name = 'ContentGeneration';

  async run(input: AgentInput): Promise<AgentResult> {
    const { niche, platform, tone, topic, count } = input as {
      niche: string;
      platform: string;
      tone?: string;
      topic?: string;
      count?: number;
    };

    const limits = PLATFORM_LIMITS[platform] ?? PLATFORM_LIMITS.INSTAGRAM;
    const numSuggestions = Math.min(count ?? 3, 10);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media content strategist specializing in the ${niche} niche. Generate engaging content for ${platform}. Caption limit: ${limits.captionMax} chars. Max hashtags: ${limits.hashtagMax}. ${tone ? `Tone: ${tone}.` : ''} Return JSON array.`,
        },
        {
          role: 'user',
          content: `Generate ${numSuggestions} post ideas${topic ? ` about "${topic}"` : ''} for ${platform} in the ${niche} niche. For each, provide: title, caption, hashtags (array), postType (IMAGE/VIDEO/REEL/CAROUSEL/SHORT), bestTimeToPost (time string). Return as JSON array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content ?? '{"suggestions":[]}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
