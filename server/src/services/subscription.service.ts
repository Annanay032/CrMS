import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import type { UsageTier, BillingCycle, SubscriptionStatus } from '@prisma/client';

// ─── Pricing Constants ──────────────────────────────────────

export const PLAN_PRICING: Record<string, Record<string, Record<string, number>>> = {
  // tier -> cycle -> currency -> amount
  FREE: { MONTHLY: { INR: 0, USD: 0 }, YEARLY: { INR: 0, USD: 0 } },
  PRO: { MONTHLY: { INR: 1499, USD: 19 }, YEARLY: { INR: 14990, USD: 190 } },
  ENTERPRISE: { MONTHLY: { INR: 4999, USD: 49 }, YEARLY: { INR: 49990, USD: 490 } },
};

const TRIAL_DAYS = 14;

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };

// ─── Helpers ────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function periodEndFromCycle(start: Date, cycle: BillingCycle): Date {
  return cycle === 'YEARLY' ? addMonths(start, 12) : addMonths(start, 1);
}

// ─── Core ───────────────────────────────────────────────────

/** Get the effective tier for a user (considers trial/active/expired). */
export async function getCurrentTier(userId: string): Promise<UsageTier> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return 'FREE';

  if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') return sub.tier;
  if (sub.status === 'PAST_DUE') return sub.tier; // grace period
  return 'FREE'; // CANCELED / EXPIRED
}

/** Get full subscription record. */
export async function getSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!sub) {
    return {
      tier: 'FREE' as UsageTier,
      status: 'ACTIVE' as SubscriptionStatus,
      billingCycle: 'MONTHLY' as BillingCycle,
      currency: 'INR',
      trialDaysRemaining: 0,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      transactions: [],
    };
  }

  let trialDaysRemaining = 0;
  if (sub.status === 'TRIALING' && sub.trialEnd) {
    trialDaysRemaining = Math.max(0, Math.ceil((sub.trialEnd.getTime() - Date.now()) / 86_400_000));
  }

  return {
    id: sub.id,
    tier: sub.tier,
    status: sub.status,
    billingCycle: sub.billingCycle,
    currency: sub.currency,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    trialStart: sub.trialStart?.toISOString() ?? null,
    trialEnd: sub.trialEnd?.toISOString() ?? null,
    trialDaysRemaining,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    paymentProvider: sub.paymentProvider,
    transactions: sub.transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      provider: t.provider,
      status: t.status,
      invoiceUrl: t.invoiceUrl,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

/** Create or upgrade a subscription (starts trial for paid plans). */
export async function createSubscription(
  userId: string,
  tier: UsageTier,
  billingCycle: BillingCycle,
  currency: string,
) {
  if (tier === 'FREE') {
    return ensureFreeSubscription(userId);
  }

  const now = new Date();
  const trialEnd = addDays(now, TRIAL_DAYS);

  const sub = await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier,
      billingCycle,
      currency,
      status: 'TRIALING',
      trialStart: now,
      trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      tier,
      billingCycle,
      currency,
      status: 'TRIALING',
      trialStart: now,
      trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
    },
  });

  logger.info(`Subscription created: user=${userId} tier=${tier} cycle=${billingCycle} trial=14d`);
  return sub;
}

/** Ensure a FREE subscription record exists. */
export async function ensureFreeSubscription(userId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      tier: 'FREE',
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      currency: 'INR',
    },
  });
}

/** Activate a subscription after successful payment. */
export async function activateSubscription(userId: string, provider: 'STRIPE' | 'RAZORPAY', providerSubId: string, providerCustomerId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw new Error('No subscription found');

  const now = new Date();
  const periodEnd = periodEndFromCycle(now, sub.billingCycle);

  return prisma.subscription.update({
    where: { userId },
    data: {
      status: 'ACTIVE',
      paymentProvider: provider,
      providerSubscriptionId: providerSubId,
      providerCustomerId: providerCustomerId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialStart: null,
      trialEnd: null,
    },
  });
}

/** Change plan (upgrade or downgrade). */
export async function changePlan(userId: string, newTier: UsageTier, billingCycle: BillingCycle) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw new Error('No subscription found');

  const currentRank = TIER_RANK[sub.tier] ?? 0;
  const newRank = TIER_RANK[newTier] ?? 0;

  if (newTier === 'FREE') {
    return cancelSubscription(userId);
  }

  // Upgrade: immediate, Downgrade: at period end
  if (newRank > currentRank) {
    return prisma.subscription.update({
      where: { userId },
      data: { tier: newTier, billingCycle },
    });
  } else {
    // Downgrade happens at end of current period — store the intent
    // For now we just update immediately (simplified)
    return prisma.subscription.update({
      where: { userId },
      data: { tier: newTier, billingCycle },
    });
  }
}

/** Cancel subscription (access continues until period end). */
export async function cancelSubscription(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
}

/** Reactivate a pending-cancel subscription. */
export async function reactivateSubscription(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });
}

/** Record a payment transaction. */
export async function recordPayment(
  subscriptionId: string,
  userId: string,
  amount: number,
  currency: string,
  provider: 'STRIPE' | 'RAZORPAY' | 'NONE',
  providerPaymentId: string | null,
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'REFUNDED',
  invoiceUrl?: string,
) {
  return prisma.paymentTransaction.create({
    data: {
      subscriptionId,
      userId,
      amount,
      currency,
      provider,
      providerPaymentId,
      status,
      invoiceUrl,
    },
  });
}

/** Get payment history for a user. */
export async function getPaymentHistory(userId: string) {
  return prisma.paymentTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/** Handle expired trials — called by the subscription job. */
export async function handleTrialExpiry() {
  const now = new Date();

  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEnd: { lt: now },
    },
  });

  for (const sub of expiredTrials) {
    // If they have a payment provider, try to charge; otherwise downgrade
    if (sub.paymentProvider === 'NONE') {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { tier: 'FREE', status: 'ACTIVE', trialStart: null, trialEnd: null },
      });
      logger.info(`Trial expired, downgraded to FREE: user=${sub.userId}`);
    } else {
      // Payment provider will handle renewal via webhooks
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE' },
      });
      logger.warn(`Trial expired, awaiting payment: user=${sub.userId}`);
    }
  }

  // Handle canceled subscriptions past their period end
  const expiredCanceled = await prisma.subscription.findMany({
    where: {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: { lt: now },
      status: { in: ['ACTIVE', 'PAST_DUE'] },
    },
  });

  for (const sub of expiredCanceled) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        tier: 'FREE',
        status: 'EXPIRED',
        cancelAtPeriodEnd: false,
        paymentProvider: 'NONE',
        providerSubscriptionId: null,
        providerCustomerId: null,
      },
    });
    logger.info(`Subscription expired after cancellation: user=${sub.userId}`);
  }

  return { expiredTrials: expiredTrials.length, expiredCanceled: expiredCanceled.length };
}

/** Get pricing info for a specific tier/cycle/currency. */
export function getPricing(tier: string, cycle: string, currency: string): number {
  return PLAN_PRICING[tier]?.[cycle]?.[currency] ?? 0;
}
