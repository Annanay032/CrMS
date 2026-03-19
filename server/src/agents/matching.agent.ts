import { env } from '../config/env.js';
import { prisma, openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';
import { computeMatchScores, type ScoredCreator } from '../matching/scoring.js';

export class MatchingAgent extends BaseAgent {
  readonly agentType = AgentType.MATCHING;
  readonly name = 'Matching';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as string) || 'match';

    switch (action) {
      case 'discover_lookalikes':
        return this.discoverLookalikes(input);
      case 'rank_by_roi':
        return this.rankByROIPotential(input);
      case 'assess_audience':
        return this.assessAudienceQuality(input);
      default:
        return this.matchCampaign(input);
    }
  }

  private async matchCampaign(input: AgentInput): Promise<AgentResult> {
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

  private async discoverLookalikes(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId } = input as { creatorProfileId: string };

    const source = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: { user: { select: { name: true } }, platformStats: true },
    });

    if (!source) throw new Error('Creator not found');

    const candidates = await prisma.creatorProfile.findMany({
      where: {
        id: { not: creatorProfileId },
        niche: { hasSome: source.niche },
        availabilityStatus: 'available',
      },
      include: { user: { select: { name: true } }, platformStats: true },
      take: 50,
    });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a creator talent scout. Find creators similar to a reference creator based on niche, audience, platform presence, and style. Return JSON.',
        },
        {
          role: 'user',
          content: `Reference creator: ${source.user.name}, niche: ${source.niche.join(', ')}, platforms: ${source.platformStats.map((s) => `${s.platform}: ${s.followers} followers`).join(', ')}

Candidate creators:
${JSON.stringify(candidates.map((c) => ({ id: c.id, name: c.user.name, niche: c.niche, platforms: c.platformStats.map((s) => ({ platform: s.platform, followers: s.followers, engagement: s.engagementRate })) })))}

Return JSON with "lookalikes" array of top 10: { creatorProfileId, name, similarityScore (0-1), reasons (string array) }.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"lookalikes":[]}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async rankByROIPotential(input: AgentInput): Promise<AgentResult> {
    const { creatorIds, campaignBudget } = input as { creatorIds: string[]; campaignBudget?: number };

    const creators = await prisma.creatorProfile.findMany({
      where: { id: { in: creatorIds } },
      include: {
        user: { select: { name: true } },
        platformStats: true,
        _count: { select: { campaignMatches: true } },
      },
    });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an ROI analyst for influencer marketing. Rank creators by estimated return on investment. Return JSON.',
        },
        {
          role: 'user',
          content: `Budget: $${campaignBudget ?? 'flexible'}

Creators to rank:
${JSON.stringify(creators.map((c) => ({ id: c.id, name: c.user.name, niche: c.niche, reliability: c.reliabilityScore, pastCampaigns: c._count.campaignMatches, platforms: c.platformStats.map((s) => ({ platform: s.platform, followers: s.followers, engagement: s.engagementRate, avgLikes: s.avgLikes })) })))}

Return JSON with "rankings" array: { creatorProfileId, name, roiScore (0-1), estimatedCPM, estimatedReach, reasoning (1 sentence) }. Sort by roiScore descending.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"rankings":[]}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async assessAudienceQuality(input: AgentInput): Promise<AgentResult> {
    const { creatorProfileId } = input as { creatorProfileId: string };

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: {
        user: { select: { name: true } },
        platformStats: true,
        audienceInsights: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    if (!creator) throw new Error('Creator not found');

    const insight = creator.audienceInsights[0];

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an audience analytics specialist. Assess the quality and authenticity of a creator\'s audience. Return JSON.',
        },
        {
          role: 'user',
          content: `Creator: ${creator.user.name}
Niche: ${creator.niche.join(', ')}
Platforms: ${creator.platformStats.map((s) => `${s.platform}: ${s.followers} followers, ${s.engagementRate}% engagement`).join('; ')}
${insight ? `Demographics: ${JSON.stringify(insight.demographics)}, Top Countries: ${JSON.stringify(insight.topCountries)}` : 'No demographic data available'}

Assess audience quality. Return JSON with: overallScore (0-100), authenticityEstimate ("high"|"medium"|"low"), engagementQuality ("excellent"|"good"|"average"|"poor"), audienceRelevance (string), redFlags (string array), strengths (string array), recommendations (string array).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }
}
