import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

interface PlatformSpec {
  captionMax: number;
  hashtagMax: number;
  supportedTypes: string[];
  aspectRatios?: string[];
}

const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  INSTAGRAM: { captionMax: 2200, hashtagMax: 30, supportedTypes: ['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL'] },
  YOUTUBE: { captionMax: 5000, hashtagMax: 15, supportedTypes: ['VIDEO', 'SHORT'] },
  TIKTOK: { captionMax: 2200, hashtagMax: 10, supportedTypes: ['VIDEO', 'REEL'] },
  TWITTER: { captionMax: 280, hashtagMax: 5, supportedTypes: ['IMAGE', 'VIDEO', 'THREAD'] },
  LINKEDIN: { captionMax: 3000, hashtagMax: 10, supportedTypes: ['IMAGE', 'VIDEO', 'CAROUSEL'] },
  THREADS: { captionMax: 500, hashtagMax: 5, supportedTypes: ['IMAGE', 'VIDEO', 'THREAD'] },
  BLUESKY: { captionMax: 300, hashtagMax: 5, supportedTypes: ['IMAGE', 'VIDEO'] },
  FACEBOOK: { captionMax: 5000, hashtagMax: 10, supportedTypes: ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'] },
  PINTEREST: { captionMax: 500, hashtagMax: 20, supportedTypes: ['IMAGE', 'VIDEO'] },
};

type PublishAction = 'format' | 'validate' | 'first_comment' | 'multi_platform';

export class PublishingAgent extends BaseAgent {
  readonly agentType = AgentType.PUBLISHING;
  readonly name = 'Publishing';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as PublishAction) || 'format';

    switch (action) {
      case 'validate':
        return this.validateForPlatform(input);
      case 'first_comment':
        return this.generateFirstComment(input);
      case 'multi_platform':
        return this.formatMultiPlatform(input);
      default:
        return this.formatForPlatform(input);
    }
  }

  private async formatForPlatform(input: AgentInput): Promise<AgentResult> {
    const { caption, hashtags, platform, postType } = input as {
      caption: string;
      hashtags?: string[];
      platform: string;
      postType: string;
    };

    const spec = PLATFORM_SPECS[platform] ?? PLATFORM_SPECS.INSTAGRAM;

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media publishing expert. Optimize content for ${platform}. Caption limit: ${spec.captionMax} chars. Max hashtags: ${spec.hashtagMax}. Post type: ${postType}. Return JSON.`,
        },
        {
          role: 'user',
          content: `Optimize this post for ${platform}:
Caption: "${caption}"
Hashtags: ${JSON.stringify(hashtags ?? [])}

Format the caption to fit within the character limit, optimize hashtag placement (inline vs. end), and add relevant emojis. Return JSON with: caption (optimized), hashtags (trimmed to platform limit), notes (brief formatting advice).`,
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

  private validateForPlatform(input: AgentInput): Promise<AgentResult> {
    const { caption, hashtags, platform, postType, mediaUrls } = input as {
      caption?: string;
      hashtags?: string[];
      platform: string;
      postType: string;
      mediaUrls?: string[];
    };

    const spec = PLATFORM_SPECS[platform] ?? PLATFORM_SPECS.INSTAGRAM;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (caption && caption.length > spec.captionMax) {
      errors.push(`Caption exceeds ${platform} limit of ${spec.captionMax} characters (current: ${caption.length})`);
    }

    if (hashtags && hashtags.length > spec.hashtagMax) {
      warnings.push(`Too many hashtags for ${platform} (max ${spec.hashtagMax}, current: ${hashtags.length})`);
    }

    if (!spec.supportedTypes.includes(postType)) {
      errors.push(`${postType} is not supported on ${platform}. Supported: ${spec.supportedTypes.join(', ')}`);
    }

    if (!mediaUrls?.length && ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL', 'SHORT'].includes(postType)) {
      warnings.push(`No media attached for ${postType} post`);
    }

    return Promise.resolve({
      output: {
        isValid: errors.length === 0,
        errors,
        warnings,
        platform,
        spec,
      },
    });
  }

  private async generateFirstComment(input: AgentInput): Promise<AgentResult> {
    const { caption, platform, niche } = input as {
      caption: string;
      platform: string;
      niche?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media engagement expert. Generate a first comment to boost engagement on ${platform} posts${niche ? ` in the ${niche} niche` : ''}. First comments typically contain additional hashtags, a CTA, or a conversation starter. Return JSON.`,
        },
        {
          role: 'user',
          content: `Post caption: "${caption}"

Generate 3 first comment options. Each should be different in style: one hashtag-heavy, one CTA-focused, one conversation-starter. Return JSON with "comments" array of objects with: text, style (hashtag/cta/conversation), reasoning (why this works).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{"comments":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async formatMultiPlatform(input: AgentInput): Promise<AgentResult> {
    const { caption, hashtags, targetPlatforms, postType } = input as {
      caption: string;
      hashtags?: string[];
      targetPlatforms: string[];
      postType: string;
    };

    const platformDetails = targetPlatforms.map((p) => {
      const spec = PLATFORM_SPECS[p] ?? PLATFORM_SPECS.INSTAGRAM;
      return `${p}: max ${spec.captionMax} chars, max ${spec.hashtagMax} hashtags, supported: ${spec.supportedTypes.join('/')}`;
    });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a multi-platform publishing specialist. Adapt a single post for multiple social media platforms simultaneously. Each adaptation should feel native to the platform. Return JSON.`,
        },
        {
          role: 'user',
          content: `Original content:
Caption: "${caption}"
Hashtags: ${JSON.stringify(hashtags ?? [])}
Post type: ${postType}

Adapt for these platforms: ${platformDetails.join('; ')}

For each platform, provide: platform, caption (adapted), hashtags (adapted array), postType (best format for that platform), firstComment (optional engagement booster). Return JSON with "platforms" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content ?? '{"platforms":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
