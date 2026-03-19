import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';
import * as integrationHub from '../services/integration-hub.service.js';

type StudioAction = 'compose' | 'rewrite' | 'image_gen' | 'integrations_status' | 'suggest_media' | 'intelligence' | 'video_analysis' | 'create_clip';

export class StudioAgent extends BaseAgent {
  readonly agentType = 'STUDIO' as AgentType;
  readonly name = 'Studio';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as StudioAction) || 'compose';

    switch (action) {
      case 'rewrite':
        return this.rewriteCaption(input);
      case 'image_gen':
        return this.generateImage(input);
      case 'integrations_status':
        return this.getIntegrationsStatus();
      case 'suggest_media':
        return this.suggestMedia(input);
      case 'intelligence':
        return this.intelligence(input);
      case 'video_analysis':
        return this.videoAnalysis(input);
      case 'create_clip':
        return this.createClip(input);
      default:
        return this.compose(input);
    }
  }

  /**
   * Compose: given a topic/description, produce a full post draft
   * with caption, hashtags, and media suggestions.
   */
  private async compose(input: AgentInput): Promise<AgentResult> {
    const { topic, platform, tone, postType } = input as {
      topic: string;
      platform?: string;
      tone?: string;
      postType?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional social media content creator working inside a Studio app. Generate a complete post draft. Platform: ${platform || 'INSTAGRAM'}. ${tone ? `Tone: ${tone}.` : ''} Return JSON with fields: caption (string), hashtags (string[]), suggestedPostType (string), mediaPrompt (string — a DALL-E prompt for an accompanying image), hooks (string[] — 3 alternative opening hooks).`,
        },
        {
          role: 'user',
          content: `Create a post about: "${topic}"${postType ? ` as a ${postType}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Rewrite: take existing caption and rewrite it with a specific intent
   */
  private async rewriteCaption(input: AgentInput): Promise<AgentResult> {
    const { caption, intent, platform, tone } = input as {
      caption: string;
      intent: string;
      platform?: string;
      tone?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media copywriting expert. Rewrite the given caption based on the user's intent. Platform: ${platform || 'INSTAGRAM'}. ${tone ? `Tone: ${tone}.` : ''} Return JSON with fields: caption (string), hashtags (string[]), notes (string — brief explanation of changes).`,
        },
        {
          role: 'user',
          content: `Original caption: "${caption}"\n\nRewrite intent: ${intent}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Generate Image — delegates to the Integration Hub
   */
  private async generateImage(input: AgentInput): Promise<AgentResult> {
    const { prompt, size, quality, style } = input as {
      prompt: string;
      size?: string;
      quality?: string;
      style?: string;
    };

    const result = await integrationHub.generateImage(prompt, { size, quality, style });

    return {
      output: result,
      tokensUsed: 0,
    };
  }

  /**
   * Return the status of all external integrations
   */
  private async getIntegrationsStatus(): Promise<AgentResult> {
    return {
      output: { integrations: integrationHub.getIntegrationStatuses() },
      tokensUsed: 0,
    };
  }

  /**
   * Suggest a DALL-E prompt for media based on the caption
   */
  private async suggestMedia(input: AgentInput): Promise<AgentResult> {
    const { caption, platform, postType } = input as {
      caption: string;
      platform?: string;
      postType?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Based on the social media caption provided, suggest 3 image generation prompts that would work perfectly as accompanying visuals. Platform: ${platform || 'INSTAGRAM'}. Post type: ${postType || 'IMAGE'}. Return JSON with fields: prompts (array of objects with: prompt (string), style (string — e.g., "photography", "illustration", "3d-render"), rationale (string)).`,
        },
        {
          role: 'user',
          content: caption,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content ?? '{"prompts":[]}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Intelligence — analyze post content and return best times, hashtags, score, tips
   */
  private async intelligence(input: AgentInput): Promise<AgentResult> {
    const { caption, hashtags, platform, postType } = input as {
      caption: string;
      hashtags?: string;
      platform?: string;
      postType?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media intelligence engine. Analyze the post content and return optimization data. Platform: ${platform || 'INSTAGRAM'}. Post type: ${postType || 'IMAGE'}. Return JSON with fields:
- bestTimes (string[] — 3-5 optimal posting times like "Tuesday 9:00 AM", "Wednesday 6:00 PM")
- hashtags (string[] — 10-15 recommended hashtags including trending ones, with # prefix)
- contentScore (number 0-100 — rate the post quality)
- tips (string[] — 3-5 actionable improvement tips)
- audienceInsight (string — brief audience analysis and reach estimation)`,
        },
        {
          role: 'user',
          content: `Caption: "${caption}"${hashtags ? `\nCurrent hashtags: ${hashtags}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Video Analysis — analyze video for retention, rewatch hotspots, engagement
   */
  private async videoAnalysis(input: AgentInput): Promise<AgentResult> {
    const { videoUrl, platform } = input as {
      videoUrl: string;
      platform?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a video analytics expert. Given a video URL, analyze viewing patterns and provide retention data. Platform: ${platform || 'YOUTUBE'}. Return JSON with fields:
- retention (array of { time: number (seconds), percent: number (0-100) } — simulated retention curve with ~20 data points)
- rewatchHotspots (array of { start: number, end: number, intensity: number (1-10) } — segments viewers rewatch most)
- engagementMetrics (object with: avgWatchTime, completionRate, likeToViewRatio, commentRate — all numbers)
- dropOffPoints (number[] — timestamps in seconds where significant viewer drop-off occurs)
- suggestions (string[] — 3-5 actionable suggestions to improve retention)`,
        },
        {
          role: 'user',
          content: `Analyze this video: ${videoUrl}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Create Clip — suggest optimal short clips from long-form video
   */
  private async createClip(input: AgentInput): Promise<AgentResult> {
    const { videoUrl, duration, style } = input as {
      videoUrl: string;
      duration?: number;
      style?: string;
    };

    const maxDuration = duration || 60;
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a video editing AI that identifies the best moments in long-form content for creating short-form clips (Reels, Shorts, TikToks). Max clip duration: ${maxDuration}s. ${style ? `Style: ${style}.` : ''} Return JSON with fields:
- clips (array of { start: number (seconds), end: number (seconds), title: string, score: number (0-100 virality score) } — top 5 clip suggestions sorted by score)
- suggestedCuts (array of { start: number, end: number, rationale: string } — additional interesting segments)`,
        },
        {
          role: 'user',
          content: `Find the best short-form clips in this video: ${videoUrl}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
