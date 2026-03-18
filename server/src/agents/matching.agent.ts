import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';
import { computeMatchScores, type ScoredCreator } from '../matching/scoring.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || 'sk-placeholder' });

export class MatchingAgent extends BaseAgent {
  readonly agentType = AgentType.MATCHING;
  readonly name = 'Matching';

  async run(input: AgentInput): Promise<AgentResult> {
    const { campaignId } = input as { campaignId: string };

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        criteria: true,
        brandProfile: true,
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    // Find eligible creators based on target platforms
    const creators = await prisma.creatorProfile.findMany({
      where: {
        availabilityStatus: 'available',
        platformStats: {
          some: { platform: { in: campaign.targetPlatforms } },
        },
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        platformStats: true,
      },
    });

    // Compute algorithmic match scores
    const scoredCreators: ScoredCreator[] = computeMatchScores(creators, campaign);

    // Use AI to enhance rankings with contextual reasoning
    const topCandidates = scoredCreators.slice(0, 20);
    let aiEnhanced = topCandidates;

    if (topCandidates.length > 0) {
      try {
        const response = await openai.chat.completions.create({
          model: env.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a brand-creator matchmaking expert. Re-rank and annotate the top creator matches for a campaign. Provide brief reasoning for each match strength. Return JSON.',
            },
            {
              role: 'user',
              content: `Campaign: "${campaign.title}" — ${campaign.description ?? ''}
Target niche: ${campaign.targetNiche.join(', ')}
Platforms: ${campaign.targetPlatforms.join(', ')}
Budget: $${campaign.budget ?? 'flexible'}

Top creator matches (pre-scored):
${JSON.stringify(topCandidates.map((c) => ({
  id: c.creatorProfileId,
  name: c.name,
  niche: c.niche,
  score: c.totalScore,
  breakdown: c.breakdown,
  platforms: c.platforms,
})))}

For each creator, provide: creatorProfileId, adjustedScore (0-1), reasoning (1-2 sentences). Return JSON with "rankings" array.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(content);

        if (parsed.rankings && Array.isArray(parsed.rankings)) {
          for (const ranking of parsed.rankings) {
            const match = aiEnhanced.find((c) => c.creatorProfileId === ranking.creatorProfileId);
            if (match) {
              match.totalScore = (match.totalScore + (ranking.adjustedScore ?? match.totalScore)) / 2;
              match.aiReasoning = ranking.reasoning;
            }
          }
          aiEnhanced.sort((a, b) => b.totalScore - a.totalScore);
        }
      } catch {
        // AI enrichment is optional — algorithmic scores are sufficient
      }
    }

    // Persist match results
    const matchRecords = await Promise.all(
      aiEnhanced.map((scored) =>
        prisma.campaignMatch.upsert({
          where: {
            campaignId_creatorProfileId: {
              campaignId: campaign.id,
              creatorProfileId: scored.creatorProfileId,
            },
          },
          update: {
            matchScore: scored.totalScore,
            scoreBreakdown: scored.breakdown as any,
          },
          create: {
            campaignId: campaign.id,
            creatorProfileId: scored.creatorProfileId,
            matchScore: scored.totalScore,
            scoreBreakdown: scored.breakdown as any,
          },
        }),
      ),
    );

    return {
      output: {
        campaignId: campaign.id,
        totalCandidates: creators.length,
        matchedCreators: aiEnhanced.map((c) => ({
          creatorProfileId: c.creatorProfileId,
          name: c.name,
          score: Math.round(c.totalScore * 100) / 100,
          breakdown: c.breakdown,
          reasoning: c.aiReasoning,
          platforms: c.platforms,
        })),
        matchRecordsCreated: matchRecords.length,
      },
      tokensUsed: undefined,
    };
  }
}
