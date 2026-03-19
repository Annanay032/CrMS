import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/common.js';
import { getCurrentTier } from '../services/subscription.service.js';
import type { UsageTier } from '@prisma/client';

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };

// ─── Plan Limits ────────────────────────────────────────────

export interface PlanLimits {
  channels: number;
  scheduledPostsPerChannel: number;
  ideas: number;
  tags: number;
  teamMembers: number;
  aiTokensPerDay: number;
  mediaStorageMB: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    channels: 3,
    scheduledPostsPerChannel: 10,
    ideas: 100,
    tags: 3,
    teamMembers: 2,
    aiTokensPerDay: 50_000,
    mediaStorageMB: 500,
  },
  PRO: {
    channels: 10,
    scheduledPostsPerChannel: Infinity,
    ideas: Infinity,
    tags: 250,
    teamMembers: 10,
    aiTokensPerDay: 200_000,
    mediaStorageMB: 10_240,
  },
  ENTERPRISE: {
    channels: Infinity,
    scheduledPostsPerChannel: Infinity,
    ideas: Infinity,
    tags: 250,
    teamMembers: Infinity,
    aiTokensPerDay: 1_000_000,
    mediaStorageMB: 102_400,
  },
};

// ─── Middleware: Require Minimum Plan ────────────────────────

/**
 * Express middleware that checks whether the user's subscription tier
 * meets the minimum required tier to access the route.
 *
 * Usage: `router.get('/...', authenticate, requirePlan('PRO'), handler)`
 */
export function requirePlan(minTier: UsageTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const userTier = await getCurrentTier(req.user.userId);
    const userRank = TIER_RANK[userTier] ?? 0;
    const requiredRank = TIER_RANK[minTier] ?? 0;

    if (userRank < requiredRank) {
      res.status(403).json({
        success: false,
        error: `This feature requires the ${minTier} plan or higher. You are on ${userTier}.`,
        code: 'PLAN_UPGRADE_REQUIRED',
        requiredTier: minTier,
        currentTier: userTier,
      });
      return;
    }

    next();
  };
}

// ─── Middleware: Check Specific Feature Limit ────────────────

export type FeatureLimitKey = keyof PlanLimits;

/**
 * Returns the plan limit value for the given user's tier + feature.
 */
export async function getFeatureLimit(userId: string, feature: FeatureLimitKey): Promise<number> {
  const tier = await getCurrentTier(userId);
  return PLAN_LIMITS[tier]?.[feature] ?? PLAN_LIMITS.FREE[feature];
}
