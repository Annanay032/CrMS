import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import * as subscriptionService from './subscription.service.js';
import type { UsageTier, BillingCycle } from '@prisma/client';

// ─── Razorpay Client ────────────────────────────────────────

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  // Dynamic import avoids crash if razorpay isn't installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

// Razorpay plan IDs (configure these in Razorpay Dashboard)
const RAZORPAY_PLAN_MAP: Record<string, Record<string, string>> = {
  PRO: { MONTHLY: 'plan_pro_monthly', YEARLY: 'plan_pro_yearly' },
  ENTERPRISE: { MONTHLY: 'plan_enterprise_monthly', YEARLY: 'plan_enterprise_yearly' },
};

// ─── Create Subscription ────────────────────────────────────

export async function createSubscription(
  userId: string,
  tier: UsageTier,
  billingCycle: BillingCycle,
) {
  const razorpay = getRazorpay();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const planId = RAZORPAY_PLAN_MAP[tier]?.[billingCycle];
  if (!planId) throw new Error(`No Razorpay plan for ${tier}/${billingCycle}`);

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: billingCycle === 'YEARLY' ? 10 : 120, // max billing cycles
    customer_notify: 1,
    notes: { userId, tier, billingCycle, email: user.email },
  });

  // Store the provider subscription ID
  await prisma.subscription.update({
    where: { userId },
    data: {
      paymentProvider: 'RAZORPAY',
      providerSubscriptionId: subscription.id,
    },
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: subscription.short_url,
  };
}

// ─── Verify Payment Signature ───────────────────────────────

export function verifyPaymentSignature(
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;

  const body = `${razorpayPaymentId}|${razorpaySubscriptionId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(razorpaySignature, 'hex'),
  );
}

// ─── Webhook Handler ────────────────────────────────────────

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex'),
  );
}

export async function handleWebhookEvent(payload: Record<string, unknown>) {
  const event = payload.event as string;
  const entity = (payload.payload as Record<string, unknown>)?.subscription as Record<string, unknown> | undefined;
  const entityObj = entity?.entity as Record<string, unknown> | undefined;

  if (!entityObj) {
    logger.debug(`Razorpay webhook: no entity found for event ${event}`);
    return;
  }

  const razorpaySubId = entityObj.id as string;

  switch (event) {
    case 'subscription.activated':
    case 'subscription.charged': {
      const sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: razorpaySubId },
      });
      if (!sub) break;

      const customerId = entityObj.customer_id as string ?? '';

      await subscriptionService.activateSubscription(
        sub.userId,
        'RAZORPAY',
        razorpaySubId,
        customerId,
      );

      // Record payment if this is a charge event
      if (event === 'subscription.charged') {
        const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
        const payment = paymentEntity?.entity as Record<string, unknown> | undefined;
        if (payment) {
          await subscriptionService.recordPayment(
            sub.id,
            sub.userId,
            ((payment.amount as number) ?? 0) / 100,
            ((payment.currency as string) ?? 'INR').toUpperCase(),
            'RAZORPAY',
            payment.id as string,
            'SUCCEEDED',
          );
        }
      }

      logger.info(`Razorpay ${event}: user=${sub.userId}`);
      break;
    }

    case 'subscription.cancelled': {
      const sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: razorpaySubId },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            tier: 'FREE',
            status: 'EXPIRED',
            paymentProvider: 'NONE',
            providerSubscriptionId: null,
            cancelAtPeriodEnd: false,
          },
        });
        logger.info(`Razorpay subscription cancelled: user=${sub.userId}`);
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
      const payment = paymentEntity?.entity as Record<string, unknown> | undefined;
      if (!payment) break;

      // Try to find subscription from notes or subscription_id
      const subIdFromPayment = payment.subscription_id as string | undefined;
      if (subIdFromPayment) {
        const sub = await prisma.subscription.findFirst({
          where: { providerSubscriptionId: subIdFromPayment },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
          await subscriptionService.recordPayment(
            sub.id,
            sub.userId,
            ((payment.amount as number) ?? 0) / 100,
            ((payment.currency as string) ?? 'INR').toUpperCase(),
            'RAZORPAY',
            payment.id as string,
            'FAILED',
          );
          logger.warn(`Razorpay payment failed: user=${sub.userId}`);
        }
      }
      break;
    }

    default:
      logger.debug(`Unhandled Razorpay event: ${event}`);
  }
}
