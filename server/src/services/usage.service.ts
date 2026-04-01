import { prisma } from '../config/index.js';
import { redis } from '../config/redis.js';
import type { AgentType } from '../types/enums.js';
import { getCurrentTier } from './subscription.service.js';

// Agent model tier — high-value agents get gpt-4, lower-stakes get gpt-4o-mini
const HIGH_VALUE_AGENTS: Set<string> = new Set([
  'CONTENT_GENERATION', 'ANALYTICS', 'LISTENING', 'TREND_DETECTION', 'COMPETITIVE',
]);

const TIER_LIMITS: Record<string, number> = {
  FREE: 50_000,
  PRO: 200_000,
  ENTERPRISE: 1_000_000,
};

// Cost per 1K tokens (USD) — approximate pricing
const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gpt-4':      { input: 0.03, output: 0.06 },
  'gpt-4o':     { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

/** Calculate estimated cost for a token count on a given model. */
export function estimateCost(tokens: number, model: string): number {
  const rates = COST_PER_1K[model] ?? COST_PER_1K['gpt-4o-mini'];
  // Approximate: assume 60% input, 40% output ratio
  const inputTokens = tokens * 0.6;
  const outputTokens = tokens * 0.4;
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

export function getModelForAgent(agentType: string): string {
  return HIGH_VALUE_AGENTS.has(agentType) ? 'gpt-4' : 'gpt-4o-mini';
}

/** Ensure a budget record exists for the user, auto-creating if needed. */
export async function ensureBudget(userId: string) {
  const tier = await getCurrentTier(userId);
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;

  let budget = await prisma.usageBudget.findUnique({ where: { userId } });
  if (!budget) {
    budget = await prisma.usageBudget.create({
      data: { userId, dailyTokenLimit: limit },
    });
  }

  // Sync daily limit from subscription tier
  if (budget.dailyTokenLimit !== limit) {
    budget = await prisma.usageBudget.update({
      where: { userId },
      data: { dailyTokenLimit: limit },
    });
  }

  // Auto-reset if a new day has started
  const now = new Date();
  if (budget.resetAt < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    budget = await prisma.usageBudget.update({
      where: { userId },
      data: { tokensUsedToday: 0, resetAt: now },
    });
  }

  return { ...budget, tier };
}

/** Check whether the user has enough budget for an agent call. Throws if over limit. */
export async function checkBudget(userId: string): Promise<void> {
  const budget = await ensureBudget(userId);
  if (budget.tokensUsedToday >= budget.dailyTokenLimit) {
    throw new Error(`Daily token budget exhausted (${budget.tokensUsedToday}/${budget.dailyTokenLimit}). Resets tomorrow.`);
  }
}

/** Record token usage after an agent call. */
export async function recordUsage(userId: string, agentType: AgentType, tokensUsed: number, model: string) {
  await Promise.all([
    prisma.usageBudget.update({
      where: { userId },
      data: { tokensUsedToday: { increment: tokensUsed } },
    }),
    prisma.agentUsageLog.create({
      data: { userId, agentType, tokensUsed, model },
    }),
  ]);

  // Cache today's usage in Redis for fast reads
  const cacheKey = `usage:${userId}:today`;
  await redis.incrby(cacheKey, tokensUsed).catch(() => {});
  await redis.expire(cacheKey, 86400).catch(() => {});
}

/** Get current usage summary for a user. */
export async function getUsageSummary(userId: string) {
  const budget = await ensureBudget(userId);

  // Per-agent breakdown for today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const breakdown = await prisma.agentUsageLog.groupBy({
    by: ['agentType', 'model'],
    where: { userId, date: { gte: startOfDay } },
    _sum: { tokensUsed: true },
    _count: true,
  });

  // Aggregate by agent type (with cost)
  const agentMap = new Map<string, { tokensUsed: number; calls: number; cost: number }>();
  let totalCost = 0;
  for (const b of breakdown) {
    const tokens = b._sum.tokensUsed ?? 0;
    const cost = estimateCost(tokens, b.model);
    totalCost += cost;
    const existing = agentMap.get(b.agentType);
    if (existing) {
      existing.tokensUsed += tokens;
      existing.calls += b._count;
      existing.cost += cost;
    } else {
      agentMap.set(b.agentType, { tokensUsed: tokens, calls: b._count, cost });
    }
  }

  return {
    tier: budget.tier,
    dailyLimit: budget.dailyTokenLimit,
    usedToday: budget.tokensUsedToday,
    remaining: Math.max(0, budget.dailyTokenLimit - budget.tokensUsedToday),
    resetAt: budget.resetAt.toISOString(),
    costToday: Math.round(totalCost * 10000) / 10000, // USD, 4 decimal places
    breakdown: Array.from(agentMap.entries()).map(([agentType, data]) => ({
      agentType,
      tokensUsed: data.tokensUsed,
      calls: data.calls,
      cost: Math.round(data.cost * 10000) / 10000,
    })),
  };
}

/** Get usage history (daily totals for the last N days). */
export async function getUsageHistory(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.agentUsageLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  // Group by date
  const daily: Record<string, { tokens: number; calls: number; cost: number }> = {};
  for (const log of logs) {
    const key = log.date.toISOString().slice(0, 10);
    if (!daily[key]) daily[key] = { tokens: 0, calls: 0, cost: 0 };
    daily[key].tokens += log.tokensUsed;
    daily[key].calls += 1;
    daily[key].cost += estimateCost(log.tokensUsed, log.model);
  }

  return Object.entries(daily).map(([date, data]) => ({
    date,
    tokens: data.tokens,
    calls: data.calls,
    cost: Math.round(data.cost * 10000) / 10000,
  }));
}
