import Stripe from 'stripe';
import { env } from '../config/env.js';
import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import * as subscriptionService from './subscription.service.js';
import type { UsageTier, BillingCycle } from '@prisma/client';

// ─── Stripe Client ──────────────────────────────────────────

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
}

// ─── Checkout ───────────────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  tier: UsageTier,
  billingCycle: BillingCycle,
  currency: string,
) {
  const stripe = getStripe();

  // Find or create Stripe customer
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  let customerId = sub?.providerCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `CrMS ${tier} Plan`,
          description: `${billingCycle === 'YEARLY' ? 'Annual' : 'Monthly'} subscription`,
        },
        unit_amount: subscriptionService.getPricing(tier, billingCycle, currency.toUpperCase()) * 100,
        recurring: {
          interval: billingCycle === 'YEARLY' ? 'year' : 'month',
        },
      },
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId, tier, billingCycle },
    },
    metadata: { userId, tier, billingCycle },
    success_url: `${env.CLIENT_URL}/settings?tab=plan&checkout=success`,
    cancel_url: `${env.CLIENT_URL}/pricing?checkout=canceled`,
  });

  // Store customer ID on subscription
  if (sub) {
    await prisma.subscription.update({
      where: { userId },
      data: { providerCustomerId: customerId },
    });
  }

  return { sessionId: session.id, url: session.url };
}

// ─── Customer Portal ────────────────────────────────────────

export async function createPortalSession(userId: string) {
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub?.providerCustomerId) {
    throw new Error('No Stripe customer found for this user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.providerCustomerId,
    return_url: `${env.CLIENT_URL}/settings`,
  });

  return { url: session.url };
}

// ─── Webhook Handler ────────────────────────────────────────

export async function handleWebhookEvent(payload: Buffer, signature: string) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

  const event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as UsageTier;
      const billingCycle = session.metadata?.billingCycle as BillingCycle;
      if (!userId) break;

      const stripeSubId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? '';

      await subscriptionService.activateSubscription(
        userId,
        'STRIPE',
        stripeSubId,
        session.customer as string,
      );

      logger.info(`Stripe checkout completed: user=${userId} tier=${tier} cycle=${billingCycle}`);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (subId) {
        const sub = await prisma.subscription.findFirst({
          where: { providerSubscriptionId: subId },
        });
        if (sub) {
          await subscriptionService.recordPayment(
            sub.id,
            sub.userId,
            (invoice.amount_paid ?? 0) / 100,
            (invoice.currency ?? 'inr').toUpperCase(),
            'STRIPE',
            invoice.id,
            'SUCCEEDED',
            invoice.hosted_invoice_url ?? undefined,
          );

          // Renew the period
          const now = new Date();
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: sub.billingCycle === 'YEARLY'
                ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
            },
          });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (subId) {
        const sub = await prisma.subscription.findFirst({
          where: { providerSubscriptionId: subId },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });

          await subscriptionService.recordPayment(
            sub.id,
            sub.userId,
            (invoice.amount_due ?? 0) / 100,
            (invoice.currency ?? 'inr').toUpperCase(),
            'STRIPE',
            invoice.id,
            'FAILED',
          );

          logger.warn(`Stripe payment failed: user=${sub.userId}`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: stripeSub.id },
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
        logger.info(`Stripe subscription deleted: user=${sub.userId}`);
      }
      break;
    }

    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }
}
