/**
 * Multi-factor scoring engine for brand-creator matching.
 *
 * Dimensions:
 *  1. Niche alignment  — overlap between campaign target niche and creator niche tags
 *  2. Engagement rate   — higher engagement relative to platform benchmarks
 *  3. Follower fit      — neither too small nor too large for the campaign budget
 *  4. Location match    — creator location vs campaign target locations
 *  5. Language match    — overlap between creator languages and audience languages
 *  6. Budget fit        — creator's estimated rate vs campaign budget
 */

interface CreatorData {
  id: string;
  userId: string;
  niche: string[];
  location: string | null;
  languages: string[];
  availabilityStatus: string;
  user: { name: string; avatarUrl: string | null };
  platformStats: Array<{
    platform: string;
    handle: string | null;
    followers: number;
    avgLikes: number;
    avgComments: number;
    avgViews: number;
    engagementRate: number;
  }>;
}

interface CampaignData {
  id: string;
  targetNiche: string[];
  targetPlatforms: string[];
  budget: number | null;
  criteria: {
    nicheWeight: number;
    engagementWeight: number;
    followerWeight: number;
    locationWeight: number;
    budgetWeight: number;
    languageWeight: number;
  } | null;
  brandProfile: {
    targetAudience: unknown;
    budgetRangeLow: number | null;
    budgetRangeHigh: number | null;
  } | null;
}

export interface ScoreBreakdown {
  niche: number;
  engagement: number;
  followers: number;
  location: number;
  language: number;
  budget: number;
}

export interface ScoredCreator {
  creatorProfileId: string;
  name: string;
  niche: string[];
  platforms: Array<{ platform: string; followers: number; engagementRate: number }>;
  totalScore: number;
  breakdown: ScoreBreakdown;
  aiReasoning?: string;
}

// Platform engagement benchmarks (average engagement rates)
const ENGAGEMENT_BENCHMARKS: Record<string, number> = {
  INSTAGRAM: 1.5,
  YOUTUBE: 2.0,
  TIKTOK: 3.0,
};

function nicheScore(creatorNiche: string[], targetNiche: string[]): number {
  if (targetNiche.length === 0) return 0.5;
  const creatorLower = creatorNiche.map((n) => n.toLowerCase());
  const targetLower = targetNiche.map((n) => n.toLowerCase());
  const overlap = targetLower.filter((t) =>
    creatorLower.some((c) => c === t || c.includes(t) || t.includes(c)),
  ).length;
  return Math.min(1, overlap / targetLower.length);
}

function engagementScore(stats: CreatorData['platformStats'], targetPlatforms: string[]): number {
  const relevant = stats.filter((s) => targetPlatforms.includes(s.platform));
  if (relevant.length === 0) return 0;

  const scores = relevant.map((s) => {
    const benchmark = ENGAGEMENT_BENCHMARKS[s.platform] ?? 2.0;
    // Score is 1.0 when engagement rate is 2x benchmark, 0.5 at benchmark, 0 at 0
    return Math.min(1, s.engagementRate / (benchmark * 2));
  });

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function followerScore(stats: CreatorData['platformStats'], targetPlatforms: string[], budget: number | null): number {
  const relevant = stats.filter((s) => targetPlatforms.includes(s.platform));
  if (relevant.length === 0) return 0;

  const totalFollowers = relevant.reduce((s, p) => s + p.followers, 0);

  if (!budget) {
    // No budget constraint — prefer mid-range creators (10k-500k)
    if (totalFollowers >= 10000 && totalFollowers <= 500000) return 1.0;
    if (totalFollowers < 10000) return totalFollowers / 10000;
    return Math.max(0.5, 1 - (totalFollowers - 500000) / 5000000);
  }

  // Map budget to expected follower range
  const expectedFollowers = budget * 10; // rough: $1 per 10 followers reach
  const ratio = totalFollowers / expectedFollowers;
  // Best score when ratio is 0.5-2.0
  if (ratio >= 0.5 && ratio <= 2.0) return 1.0;
  if (ratio < 0.5) return ratio / 0.5;
  return Math.max(0, 1 - (ratio - 2.0) / 10);
}

function locationScore(creatorLocation: string | null, campaign: CampaignData): number {
  if (!creatorLocation) return 0.5; // neutral if unknown
  const audience = campaign.brandProfile?.targetAudience as { locations?: string[] } | null;
  if (!audience?.locations?.length) return 0.5;

  const creatorLoc = creatorLocation.toLowerCase();
  const match = audience.locations.some((loc) => creatorLoc.includes(loc.toLowerCase()));
  return match ? 1.0 : 0.2;
}

function languageScore(creatorLanguages: string[], _campaign: CampaignData): number {
  // Default expectation: English
  if (creatorLanguages.length === 0) return 0.5;
  if (creatorLanguages.includes('en')) return 1.0;
  return 0.3;
}

function budgetScore(stats: CreatorData['platformStats'], targetPlatforms: string[], budget: number | null): number {
  if (!budget) return 0.5;
  const relevant = stats.filter((s) => targetPlatforms.includes(s.platform));
  if (relevant.length === 0) return 0;

  // Estimate creator's rate based on follower count ($10 per 1000 followers as rough CPM)
  const totalFollowers = relevant.reduce((s, p) => s + p.followers, 0);
  const estimatedRate = (totalFollowers / 1000) * 10;

  if (estimatedRate <= budget) return 1.0;
  if (estimatedRate <= budget * 2) return 0.5;
  return 0.1;
}

export function computeMatchScores(creators: CreatorData[], campaign: CampaignData): ScoredCreator[] {
  const weights = campaign.criteria ?? {
    nicheWeight: 0.3,
    engagementWeight: 0.25,
    followerWeight: 0.15,
    locationWeight: 0.1,
    budgetWeight: 0.1,
    languageWeight: 0.1,
  };

  const scored: ScoredCreator[] = creators.map((creator) => {
    const breakdown: ScoreBreakdown = {
      niche: nicheScore(creator.niche, campaign.targetNiche),
      engagement: engagementScore(creator.platformStats, campaign.targetPlatforms),
      followers: followerScore(creator.platformStats, campaign.targetPlatforms, campaign.budget),
      location: locationScore(creator.location, campaign),
      language: languageScore(creator.languages, campaign),
      budget: budgetScore(creator.platformStats, campaign.targetPlatforms, campaign.budget),
    };

    const totalScore =
      breakdown.niche * weights.nicheWeight +
      breakdown.engagement * weights.engagementWeight +
      breakdown.followers * weights.followerWeight +
      breakdown.location * weights.locationWeight +
      breakdown.language * weights.languageWeight +
      breakdown.budget * weights.budgetWeight;

    return {
      creatorProfileId: creator.id,
      name: creator.user.name,
      niche: creator.niche,
      platforms: creator.platformStats
        .filter((s) => campaign.targetPlatforms.includes(s.platform))
        .map((s) => ({ platform: s.platform, followers: s.followers, engagementRate: s.engagementRate })),
      totalScore,
      breakdown,
    };
  });

  return scored.sort((a, b) => b.totalScore - a.totalScore);
}
