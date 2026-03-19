import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const PLATFORM_LIMITS: Record<string, { captionMax: number; hashtagMax: number }> = {
  INSTAGRAM: { captionMax: 2200, hashtagMax: 30 },
  YOUTUBE: { captionMax: 5000, hashtagMax: 15 },
  TIKTOK: { captionMax: 2200, hashtagMax: 10 },
  TWITTER: { captionMax: 280, hashtagMax: 5 },
  LINKEDIN: { captionMax: 3000, hashtagMax: 10 },
  THREADS: { captionMax: 500, hashtagMax: 5 },
  BLUESKY: { captionMax: 300, hashtagMax: 5 },
  FACEBOOK: { captionMax: 5000, hashtagMax: 10 },
  PINTEREST: { captionMax: 500, hashtagMax: 20 },
};

type ContentAction = 'generate' | 'repurpose' | 'ideate' | 'suggest_tags';

export class ContentGenerationAgent extends BaseAgent {
  readonly agentType = AgentType.CONTENT_GENERATION;
  readonly name = 'ContentGeneration';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as ContentAction) || 'generate';

    switch (action) {
      case 'ideate':
        return this.ideateFromTopic(input);
      case 'repurpose':
        return this.repurposePost(input);
      case 'suggest_tags':
        return this.suggestTags(input);
      default:
        return this.generatePosts(input);
    }
  }

  private async generatePosts(input: AgentInput): Promise<AgentResult> {
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
          content: `You are a social media content strategist specializing in the ${niche} niche. Generate engaging content for ${platform}. Caption limit: ${limits.captionMax} chars. Max hashtags: ${limits.hashtagMax}. ${tone ? `Tone: ${tone}.` : ''} Return JSON.`,
        },
        {
          role: 'user',
          content: `Generate ${numSuggestions} post ideas${topic ? ` about "${topic}"` : ''} for ${platform} in the ${niche} niche. For each, provide: title, caption, hashtags (array), postType (IMAGE/VIDEO/REEL/CAROUSEL/SHORT/THREAD), bestTimeToPost (time string). Return as JSON object with "suggestions" array.`,
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

  private async ideateFromTopic(input: AgentInput): Promise<AgentResult> {
    const { topic, niche, count } = input as {
      topic: string;
      niche?: string;
      count?: number;
    };

    const numIdeas = Math.min(count ?? 5, 15);

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a creative content ideation specialist${niche ? ` in the ${niche} niche` : ''}. Generate content ideas that are unique, engaging, and actionable. Return JSON.`,
        },
        {
          role: 'user',
          content: `Generate ${numIdeas} content ideas about "${topic}". For each, provide: title (catchy, concise), body (2-3 sentence summary of the content angle), suggestedPlatforms (array of best platforms from: INSTAGRAM, YOUTUBE, TIKTOK, TWITTER, LINKEDIN, THREADS), suggestedFormat (IMAGE/VIDEO/REEL/CAROUSEL/SHORT/THREAD), suggestedTags (array of 2-3 category tags like "tip", "how-to", "story", "promotion", "behind-the-scenes"). Return JSON object with "ideas" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content ?? '{"ideas":[]}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async repurposePost(input: AgentInput): Promise<AgentResult> {
    const { originalCaption, originalPlatform, targetPlatforms, tone } = input as {
      originalCaption: string;
      originalPlatform: string;
      targetPlatforms: string[];
      tone?: string;
    };

    const platformInfo = targetPlatforms.map((p) => {
      const limits = PLATFORM_LIMITS[p] ?? PLATFORM_LIMITS.INSTAGRAM;
      return `${p} (max ${limits.captionMax} chars, max ${limits.hashtagMax} hashtags)`;
    });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media content repurposing expert. Adapt content from one platform to work perfectly on others while maintaining the core message. ${tone ? `Tone: ${tone}.` : ''} Return JSON.`,
        },
        {
          role: 'user',
          content: `Original post on ${originalPlatform}: "${originalCaption}"

Repurpose this for the following platforms: ${platformInfo.join(', ')}. For each target platform, provide: platform, caption (adapted for that platform's style and limits), hashtags (array), suggestedPostType (IMAGE/VIDEO/REEL/CAROUSEL/SHORT/THREAD), notes (brief adaptation notes). Return JSON object with "repurposed" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{"repurposed":[]}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async suggestTags(input: AgentInput): Promise<AgentResult> {
    const { title, body, existingTags } = input as {
      title: string;
      body?: string;
      existingTags?: string[];
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a content categorization specialist. Suggest tags for content ideas based on their theme, format, and purpose. Return JSON.`,
        },
        {
          role: 'user',
          content: `Content: "${title}"${body ? `\nDetails: "${body}"` : ''}${existingTags?.length ? `\nExisting tags in the system: ${existingTags.join(', ')}` : ''}

Suggest 2-4 tags for this content. Prefer matching existing tags when relevant. Tags should be short (1-2 words), lowercase, category-style (e.g., "tip", "how-to", "story", "promotion", "news", "behind-the-scenes", "tutorial", "review"). Return JSON object with "tags" array of strings.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? '{"tags":[]}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
