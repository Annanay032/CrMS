import { Router } from 'express';
import type { Request, Response } from 'express';
import express from 'express';
import { handleWhatsAppWebhook, verifyWebhook } from '../services/whatsapp-inbox.service.js';
import * as stripeService from '../services/stripe.service.js';
import * as razorpayService from '../services/razorpay.service.js';
import { logger } from '../config/logger.js';

const router = Router();

// WhatsApp Cloud API webhook verification
router.get('/whatsapp', (req: Request, res: Response) => {
  const challenge = verifyWebhook(req.query as Record<string, string>);
  if (challenge !== null) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

// WhatsApp Cloud API incoming messages
router.post('/whatsapp', async (req: Request, res: Response) => {
  await handleWhatsAppWebhook(req.body);
  res.status(200).json({ success: true });
});

// Stripe webhook — needs raw body for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    await stripeService.handleWebhookEvent(req.body as Buffer, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error', err);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Razorpay webhook
router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    return;
  }

  const bodyStr = JSON.stringify(req.body);
  const valid = razorpayService.verifyWebhookSignature(bodyStr, signature);
  if (!valid) {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    await razorpayService.handleWebhookEvent(req.body);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Razorpay webhook error', err);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;
