import type { Response } from 'express';
import type { AuthRequest } from '../types/common.js';
import { env } from '../config/env.js';
import * as subscriptionService from '../services/subscription.service.js';
import * as stripeService from '../services/stripe.service.js';
import * as razorpayService from '../services/razorpay.service.js';
import type { UsageTier, BillingCycle } from '@prisma/client';

export async function getSubscription(req: AuthRequest, res: Response) {
  const data = await subscriptionService.getSubscription(req.user!.userId);
  res.json({ success: true, data });
}

export async function createCheckout(req: AuthRequest, res: Response) {
  const { tier, billingCycle, currency, provider } = req.body as {
    tier: UsageTier;
    billingCycle: BillingCycle;
    currency: string;
    provider: 'stripe' | 'razorpay';
  };

  // Ensure a subscription record exists first
  await subscriptionService.createSubscription(req.user!.userId, tier, billingCycle, currency);

  if (provider === 'stripe') {
    const data = await stripeService.createCheckoutSession(req.user!.userId, tier, billingCycle, currency);
    res.json({ success: true, data });
  } else {
    const data = await razorpayService.createSubscription(req.user!.userId, tier, billingCycle);
    res.json({ success: true, data });
  }
}

export async function changePlan(req: AuthRequest, res: Response) {
  const { tier, billingCycle } = req.body as { tier: UsageTier; billingCycle: BillingCycle };
  const data = await subscriptionService.changePlan(req.user!.userId, tier, billingCycle);
  res.json({ success: true, data });
}

export async function cancelSubscription(req: AuthRequest, res: Response) {
  const data = await subscriptionService.cancelSubscription(req.user!.userId);
  res.json({ success: true, data, message: 'Subscription will be canceled at the end of the current billing period.' });
}

export async function reactivateSubscription(req: AuthRequest, res: Response) {
  const data = await subscriptionService.reactivateSubscription(req.user!.userId);
  res.json({ success: true, data });
}

export async function getPaymentHistory(req: AuthRequest, res: Response) {
  const data = await subscriptionService.getPaymentHistory(req.user!.userId);
  res.json({ success: true, data });
}

export async function createPortalSession(req: AuthRequest, res: Response) {
  const data = await stripeService.createPortalSession(req.user!.userId);
  res.json({ success: true, data });
}

export async function verifyRazorpayPayment(req: AuthRequest, res: Response) {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body as {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  };

  const valid = razorpayService.verifyPaymentSignature(
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  );

  if (!valid) {
    res.status(400).json({ success: false, error: 'Invalid payment signature' });
    return;
  }

  res.json({ success: true, message: 'Payment verified' });
}

export async function getPricing(_req: AuthRequest, res: Response) {
  const pricing = subscriptionService.PLAN_PRICING;
  res.json({ success: true, data: pricing });
}

export async function getCheckoutConfig(_req: AuthRequest, res: Response) {
  res.json({
    success: true,
    data: {
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? null,
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY ?? null,
    },
  });
}
