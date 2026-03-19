import { Router } from 'express';
import type { Request, Response } from 'express';
import { handleWhatsAppWebhook, verifyWebhook } from '../services/whatsapp-inbox.service.js';

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

export default router;
