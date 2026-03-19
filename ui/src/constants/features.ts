import type { UsageTier } from '@/types';

// ─── Tier Ordering (for comparisons) ────────────────────────

const TIER_RANK: Record<UsageTier, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };

export function tierMeetsMinimum(userTier: UsageTier, minTier: UsageTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[minTier];
}

// ─── Tier Limits ────────────────────────────────────────────

export interface TierConfig {
  label: string;
  monthlyPriceINR: number;
  yearlyPriceINR: number;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  aiTokensPerDay: number;
  teamMembers: number | 'Unlimited';
  channels: number | 'Unlimited';
  scheduledPostsPerChannel: number | 'Unlimited';
  ideas: number | 'Unlimited';
  tags: number;
  mediaStorageMB: number | 'Unlimited';
  color: string;
}

export const TIER_CONFIG: Record<UsageTier, TierConfig> = {
  FREE: {
    label: 'Free',
    monthlyPriceINR: 0,
    yearlyPriceINR: 0,
    monthlyPriceUSD: 0,
    yearlyPriceUSD: 0,
    aiTokensPerDay: 50_000,
    teamMembers: 2,
    channels: 3,
    scheduledPostsPerChannel: 10,
    ideas: 100,
    tags: 3,
    mediaStorageMB: 500,
    color: '#3b82f6',
  },
  PRO: {
    label: 'Pro',
    monthlyPriceINR: 1_499,
    yearlyPriceINR: 14_990,
    monthlyPriceUSD: 19,
    yearlyPriceUSD: 190,
    aiTokensPerDay: 200_000,
    teamMembers: 10,
    channels: 10,
    scheduledPostsPerChannel: 'Unlimited',
    ideas: 'Unlimited',
    tags: 250,
    mediaStorageMB: 10_240,
    color: '#f59e0b',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    monthlyPriceINR: 4_999,
    yearlyPriceINR: 49_990,
    monthlyPriceUSD: 49,
    yearlyPriceUSD: 490,
    aiTokensPerDay: 1_000_000,
    teamMembers: 'Unlimited',
    channels: 'Unlimited',
    scheduledPostsPerChannel: 'Unlimited',
    ideas: 'Unlimited',
    tags: 250,
    mediaStorageMB: 102_400,
    color: '#a855f7',
  },
};

// ─── Feature Comparison Table ───────────────────────────────

export interface PlanFeature {
  name: string;
  category: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  // Content Creation
  { name: 'Ideas / Sparks', category: 'Content Creation', free: '100', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Tags', category: 'Content Creation', free: '3', pro: '250', enterprise: '250' },
  { name: 'Drafts', category: 'Content Creation', free: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Templates', category: 'Content Creation', free: true, pro: true, enterprise: true },
  { name: 'AI Assistant', category: 'Content Creation', free: true, pro: true, enterprise: true },
  { name: 'Board view', category: 'Content Creation', free: true, pro: true, enterprise: true },
  { name: 'Browser extension', category: 'Content Creation', free: 'Ideas only', pro: true, enterprise: true },

  // Publishing
  { name: 'Connected channels', category: 'Publishing', free: '3', pro: '10', enterprise: 'Unlimited' },
  { name: 'Scheduled posts per channel', category: 'Publishing', free: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'First comment scheduling', category: 'Publishing', free: false, pro: true, enterprise: true },
  { name: 'Recurring posts', category: 'Publishing', free: false, pro: true, enterprise: true },
  { name: 'Calendar view', category: 'Publishing', free: true, pro: true, enterprise: true },
  { name: 'Instagram grid planner', category: 'Publishing', free: false, pro: true, enterprise: true },
  { name: 'RSS feed auto-import', category: 'Publishing', free: false, pro: true, enterprise: true },
  { name: 'Queue management', category: 'Publishing', free: true, pro: true, enterprise: true },

  // Community
  { name: 'Unified inbox', category: 'Community', free: true, pro: true, enterprise: true },
  { name: 'Email & WhatsApp inbox', category: 'Community', free: false, pro: true, enterprise: true },
  { name: 'Saved replies', category: 'Community', free: true, pro: true, enterprise: true },
  { name: 'AI replies', category: 'Community', free: true, pro: true, enterprise: true },
  { name: 'Comment score', category: 'Community', free: false, pro: true, enterprise: true },
  { name: 'Create post from reply', category: 'Community', free: false, pro: true, enterprise: true },
  { name: 'Sentiment analysis', category: 'Community', free: false, pro: true, enterprise: true },

  // Analytics
  { name: 'Basic analytics', category: 'Analytics', free: true, pro: true, enterprise: true },
  { name: 'Advanced analytics & export', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Audience demographics', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Best time to post', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Hashtag analytics', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Organic vs Boosted analytics', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Custom reports & PDF export', category: 'Analytics', free: false, pro: true, enterprise: true },
  { name: 'Branded reports', category: 'Analytics', free: false, pro: 'Logo', enterprise: 'White-label' },
  { name: 'Auto-updating daily reports', category: 'Analytics', free: false, pro: true, enterprise: true },

  // Collaboration
  { name: 'Team members', category: 'Collaboration', free: '2', pro: '10', enterprise: 'Unlimited' },
  { name: 'Access levels / Roles', category: 'Collaboration', free: false, pro: false, enterprise: true },
  { name: 'Approval workflows', category: 'Collaboration', free: false, pro: false, enterprise: true },
  { name: 'Post comments & feedback', category: 'Collaboration', free: true, pro: true, enterprise: true },
  { name: 'Shared calendar', category: 'Collaboration', free: true, pro: true, enterprise: true },

  // AI & Growth
  { name: 'AI tokens per day', category: 'AI & Growth', free: '50k', pro: '200k', enterprise: '1M' },
  { name: 'Growth Copilot', category: 'AI & Growth', free: false, pro: true, enterprise: true },
  { name: 'Virality predictor', category: 'AI & Growth', free: false, pro: true, enterprise: true },
  { name: 'Video analysis & clip suggestions', category: 'AI & Growth', free: false, pro: true, enterprise: true },

  // Monetization
  { name: 'Revenue tracking', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Brand deal CRM', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Invoice management', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Link-in-Bio (Start Page)', category: 'Monetization', free: true, pro: true, enterprise: true },
  { name: 'Creator-Brand matching', category: 'Monetization', free: false, pro: true, enterprise: true },

  // Intelligence
  { name: 'Social listening', category: 'Intelligence', free: false, pro: true, enterprise: true },
  { name: 'Competitive intelligence', category: 'Intelligence', free: false, pro: false, enterprise: true },
  { name: 'Crisis detection', category: 'Intelligence', free: false, pro: false, enterprise: true },

  // Support
  { name: 'Help center', category: 'Support', free: true, pro: true, enterprise: true },
  { name: 'Priority support', category: 'Support', free: false, pro: true, enterprise: true },
  { name: 'Dedicated account manager', category: 'Support', free: false, pro: false, enterprise: true },
];
