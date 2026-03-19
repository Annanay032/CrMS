import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Email Inbox Service — IMAP-based email polling.
 * Uses imapflow (optional dependency). If not installed, operations are no-ops.
 */

export async function pollEmails(creatorProfileId: string, channel: {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}) {
  try {
    const ImapFlow = await import('imapflow').then(m => m.ImapFlow).catch(() => null);
    if (!ImapFlow) {
      logger.warn('imapflow not installed, skipping email poll');
      return [];
    }

    const client = new ImapFlow({
      host: channel.host,
      port: channel.port,
      secure: channel.secure,
      auth: channel.auth,
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
      const messages: Array<{ externalId: string; from: string; subject: string; text: string; date: Date }> = [];

      for await (const message of client.fetch(
        { since },
        { envelope: true, source: false, bodyStructure: true },
      )) {
        const env = message.envelope;
        if (!env) continue;

        const from = env.from?.[0]?.address ?? 'unknown';
        const subject = env.subject ?? '';
        const messageId = env.messageId ?? `email_${message.uid}`;

        // Check if already imported
        const existing = await prisma.communityInteraction.findFirst({
          where: { creatorProfileId, externalId: messageId },
        });
        if (existing) continue;

        messages.push({
          externalId: messageId,
          from,
          subject,
          text: subject, // full text would need body parsing
          date: env.date ?? new Date(),
        });
      }

      // Create interactions
      for (const msg of messages) {
        await prisma.communityInteraction.create({
          data: {
            creatorProfileId,
            platform: 'INSTAGRAM', // placeholder — emails don't have a Platform enum value, reuse closest
            interactionType: 'EMAIL',
            externalId: msg.externalId,
            authorName: msg.from,
            content: `[${msg.subject}] ${msg.text}`.slice(0, 5000),
            channelMetadata: { type: 'email', from: msg.from, subject: msg.subject },
          },
        });
      }

      logger.info(`[email-inbox] Polled ${messages.length} new emails for ${creatorProfileId}`);
      return messages;
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (err) {
    logger.error('[email-inbox] Poll failed', err);
    return [];
  }
}
