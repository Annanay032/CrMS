import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

export class EngagementAgent extends BaseAgent {
  readonly agentType = AgentType.ENGAGEMENT;
  readonly name = 'Engagement';

  async run(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId, interactionIds, tone } = input as {
      creatorProfileId: string;
      interactionIds?: string[];
      tone?: string;
    };

    // Fetch recent un-responded interactions
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

    // Get creator profile for context
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

    // Store AI suggestions back on the interactions
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      for (const suggestion of parsed.suggestions) {
        if (suggestion.id && suggestion.suggestedReply) {
          await prisma.communityInteraction.update({
            where: { id: suggestion.id },
            data: {
              aiSuggestion: suggestion.suggestedReply,
              sentiment: suggestion.sentiment ?? null,
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
}
