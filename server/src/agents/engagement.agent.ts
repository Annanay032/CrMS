import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

type EngagementAction = 'suggest_replies' | 'draft_reply' | 'learn_voice' | 'reply_in_voice' | 'suggest_saved_reply' | 'detect_spike';

export class EngagementAgent extends BaseAgent {
  readonly agentType = AgentType.ENGAGEMENT;
  readonly name = 'Engagement';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as EngagementAction) || 'suggest_replies';

    switch (action) {
      case 'draft_reply':
        return this.draftReply(input);
      case 'learn_voice':
        return this.learnVoice(input);
      case 'reply_in_voice':
        return this.replyInVoice(input);
      case 'suggest_saved_reply':
        return this.suggestSavedReply(input);
      case 'detect_spike':
        return this.detectSpike(input);
      default:
        return this.suggestReplies(input);
    }
  }

  private async suggestReplies(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, interactionIds, tone } = input as {
      creatorProfileId: string;
      interactionIds?: string[];
      tone?: string;
    };

    const where: Record<string, unknown> = {
      creatorProfileId,
      respondedAt: null,
    };
    if (interactionIds?.length) {
      where.id = { in: interactionIds };
    }

    const interactions = await prisma.communityInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (interactions.length === 0) {
      return {
        output: { suggestions: [], message: 'No pending interactions found' },
        tokensUsed: 0,
      };
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: { user: { select: { name: true } } },
    });

    const interactionData = interactions.map((i) => ({
      id: i.id,
      type: i.interactionType,
      platform: i.platform,
      author: i.authorName,
      content: i.content,
      sentiment: i.sentiment,
    }));

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a community engagement specialist for ${profile?.user.name ?? 'a creator'}. Their niche: ${profile?.niche?.join(', ') ?? 'general'}. ${tone ? `Tone: ${tone}.` : 'Match a friendly, authentic tone.'} Generate thoughtful reply suggestions for each interaction. For negative comments, suggest diplomatic responses. For questions, provide helpful answers. Return JSON.`,
        },
        {
          role: 'user',
          content: `Generate reply suggestions for these interactions: ${JSON.stringify(interactionData)}

For each interaction, return: id (interaction id), suggestedReply (string), sentiment (POSITIVE/NEGATIVE/NEUTRAL/QUESTION), priority (high/medium/low), reasoning (brief explanation of approach). Return as JSON with "suggestions" array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{"suggestions":[]}';
    const parsed = JSON.parse(content);

    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      for (const suggestion of parsed.suggestions) {
        if (suggestion.id && suggestion.suggestedReply) {
          await prisma.communityInteraction.update({
            where: { id: suggestion.id },
            data: {
              aiSuggestion: suggestion.suggestedReply,
              sentiment: suggestion.sentiment ?? null,
              priority: suggestion.priority === 'high' ? 'HIGH' : suggestion.priority === 'low' ? 'LOW' : 'MEDIUM',
            },
          });
        }
      }
    }

    return {
      output: parsed,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async draftReply(input: AgentInput): Promise<AgentResult> {
    const { interaction, tone, intent } = input as {
      interaction: { content: string; authorName?: string; platform: string; interactionType: string; sentiment?: string };
      tone?: string;
      intent?: 'thank' | 'answer' | 'resolve' | 'acknowledge' | 'deflect';
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media reply specialist. Draft a reply to a ${interaction.interactionType.toLowerCase()} on ${interaction.platform}.${tone ? ` Tone: ${tone}.` : ''} ${intent ? `Intent: ${intent}.` : ''} Return JSON.`,
        },
        {
          role: 'user',
          content: `Draft a reply to this message from ${interaction.authorName ?? 'someone'}:
"${interaction.content}"
${interaction.sentiment ? `Sentiment: ${interaction.sentiment}` : ''}

Generate: reply (the reply text), alternativeReply (a shorter version), emoji (optional single emoji to add), sentiment (your assessment of the message). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async learnVoice(input: AgentInput): Promise<AgentResult> {
    const { exampleReplies } = input as { exampleReplies: string[] };

    if (exampleReplies.length < 3) {
      return { output: { error: 'Need at least 3 example replies to learn voice' }, tokensUsed: 0 };
    }

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a linguistic analyst. Analyze writing patterns from example replies to build a voice profile. Return JSON.`,
        },
        {
          role: 'user',
          content: `Analyze these example replies to understand the writer's voice:
${exampleReplies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Extract: tonePreferences (array of 3-5 descriptors like "friendly", "casual", "witty", "professional"), vocabulary (frequently used words/phrases, array), sentenceLength (short/medium/long), emojiUsage (none/light/heavy), formalityLevel (0-10), personalityTraits (array). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async replyInVoice(input: AgentInput): Promise<AgentResult> {
    const { interaction, voiceProfile, modifier } = input as {
      interaction: { content: string; authorName?: string; platform: string };
      voiceProfile: { tonePreferences: string[]; vocabulary: string[]; formalityLevel?: number };
      modifier?: 'shorten' | 'expand' | 'rephrase' | 'make_formal' | 'make_casual';
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media reply assistant. Write replies that match this voice profile:
- Tone: ${voiceProfile.tonePreferences.join(', ')}
- Preferred phrases: ${voiceProfile.vocabulary.slice(0, 15).join(', ')}
- Formality: ${voiceProfile.formalityLevel ?? 5}/10
${modifier ? `Apply modifier: ${modifier}` : ''}
Return JSON.`,
        },
        {
          role: 'user',
          content: `Write a reply in the creator's voice to this message from ${interaction.authorName ?? 'someone'} on ${interaction.platform}:
"${interaction.content}"

Generate: reply (matching the voice profile), confidence (0-100 how well it matches the voice). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async suggestSavedReply(input: AgentInput): Promise<AgentResult> {
    const { interaction, savedReplies } = input as {
      interaction: { content: string; interactionType: string; sentiment?: string };
      savedReplies: Array<{ id: string; title: string; body: string; tags: string[] }>;
    };

    if (savedReplies.length === 0) {
      return { output: { matches: [], suggestion: 'No saved replies available' }, tokensUsed: 0 };
    }

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a reply matching assistant. Match incoming messages to saved reply templates. Return JSON.`,
        },
        {
          role: 'user',
          content: `Message: "${interaction.content}" (type: ${interaction.interactionType}, sentiment: ${interaction.sentiment ?? 'unknown'})

Available saved replies:
${savedReplies.map((r) => `- ID: ${r.id}, Title: "${r.title}", Tags: [${r.tags.join(', ')}], Body: "${r.body.slice(0, 100)}..."`).join('\n')}

Return: matches (array of {id, score: 0-100, customization: suggested edit to personalize}), sorted by score desc. Max 3 matches. Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"matches":[]}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async detectSpike(input: AgentInput): Promise<AgentResult> {
    const { currentCount, normalCount, period, recentSentiments } = input as {
      currentCount: number;
      normalCount: number;
      period: string;
      recentSentiments?: { positive: number; negative: number; neutral: number; question: number };
    };

    const spikeRatio = normalCount > 0 ? currentCount / normalCount : 1;
    const isSpike = spikeRatio >= 2;

    if (!isSpike) {
      return {
        output: { isSpike: false, spikeRatio: +spikeRatio.toFixed(1), message: 'No significant spike detected' },
        tokensUsed: 0,
      };
    }

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a social media crisis/opportunity detector. A message spike has been detected. Return JSON.`,
        },
        {
          role: 'user',
          content: `Message spike detected over ${period}:
- Current volume: ${currentCount} (${spikeRatio.toFixed(1)}x normal of ${normalCount})
${recentSentiments ? `- Sentiments: positive=${recentSentiments.positive}, negative=${recentSentiments.negative}, neutral=${recentSentiments.neutral}, questions=${recentSentiments.question}` : ''}

Assess: isSpike (true), spikeType (crisis/opportunity/viral/spam), severity (low/medium/high), description, recommendedActions (array). Return JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }
}
