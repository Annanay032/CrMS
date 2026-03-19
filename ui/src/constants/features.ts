import type { UsageTier } from '@/types';

// ─── Tier Ordering (for comparisons) ────────────────────────

const TIER_RANK: Record<UsageTier, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };

export function tierMeetsMinimum(userTier: UsageTier, minTier: UsageTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[minTier];
}

// ─── Tier Limits ────────────────────────────────────────────

export interface TierConfig {
  label: string;
  price: string;
  priceSubtext: string;
  aiTokensPerDay: number;
  teamMembers: number | 'Unlimited';
  color: string;
}

export const TIER_CONFIG: Record<UsageTier, TierConfig> = {
  FREE: {
    label: 'Free',
    price: '₹0',
    priceSubtext: 'forever',
    aiTokensPerDay: 50_000,
    teamMembers: 2,
    color: '#3b82f6',
  },
  PRO: {
    label: 'Pro',
    price: '₹1,499',
    priceSubtext: '/month',
    aiTokensPerDay: 200_000,
    teamMembers: 10,
    color: '#f59e0b',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: '₹4,999',
    priceSubtext: '/month',
    aiTokensPerDay: 1_000_000,
    teamMembers: 'Unlimited',
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
  // Content
  { name: 'Idea generation', category: 'Content', free: true, pro: true, enterprise: true },
  { name: 'Content calendar', category: 'Content', free: true, pro: true, enterprise: true },
  { name: 'Post creation & scheduling', category: 'Content', free: '5/day', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Media library', category: 'Content', free: '500 MB', pro: '10 GB', enterprise: '100 GB' },

  // Monetization
  { name: 'Revenue tracking', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Brand deal CRM', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Invoice management', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Link-in-Bio builder', category: 'Monetization', free: false, pro: true, enterprise: true },
  { name: 'Campaign collaboration', category: 'Monetization', free: true, pro: true, enterprise: true },

  // Intelligence
  { name: 'Basic analytics', category: 'Intelligence', free: true, pro: true, enterprise: true },
  { name: 'Advanced analytics & export', category: 'Intelligence', free: false, pro: true, enterprise: true },
  { name: 'Trend detection', category: 'Intelligence', free: false, pro: true, enterprise: true },
  { name: 'Social listening', category: 'Intelligence', free: false, pro: true, enterprise: true },
  { name: 'Competitive intelligence', category: 'Intelligence', free: false, pro: false, enterprise: true },

  // AI & Growth
  { name: 'AI Assistant', category: 'AI & Growth', free: true, pro: true, enterprise: true },
  { name: 'AI tokens per day', category: 'AI & Growth', free: '50k', pro: '200k', enterprise: '1M' },
  { name: 'Growth Copilot', category: 'AI & Growth', free: false, pro: true, enterprise: true },
  { name: 'Virality predictor', category: 'AI & Growth', free: false, pro: true, enterprise: true },

  // Communication
  { name: 'Unified inbox', category: 'Communication', free: true, pro: true, enterprise: true },
  { name: 'Email & WhatsApp integration', category: 'Communication', free: false, pro: true, enterprise: true },

  // Team
  { name: 'Team members', category: 'Team', free: '2', pro: '10', enterprise: 'Unlimited' },
  { name: 'Approval workflows', category: 'Team', free: false, pro: true, enterprise: true },
  { name: 'Priority support', category: 'Team', free: false, pro: true, enterprise: true },
  { name: 'Dedicated account manager', category: 'Team', free: false, pro: false, enterprise: true },
];
