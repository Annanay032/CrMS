import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { pollEmails } from '../services/email-inbox.service.js';

export async function pollEmailInboxes() {
  logger.info('[inbox-job] Polling email inboxes');

  const channels = await prisma.inboxChannel.findMany({
    where: { type: 'EMAIL', status: 'CONNECTED' },
  });

  for (const channel of channels) {
    try {
      const config = channel.config as { host: string; port: number; secure: boolean; auth: { user: string; pass: string } } | null;
      if (!config?.host) {
        logger.warn(`[inbox-job] Channel ${channel.id} has no IMAP config`);
        continue;
      }

      await pollEmails(channel.creatorProfileId, config);

      await prisma.inboxChannel.update({
        where: { id: channel.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (err) {
      logger.error(`[inbox-job] Failed for channel ${channel.id}`, err);
      await prisma.inboxChannel.update({
        where: { id: channel.id },
        data: { status: 'ERROR' },
      }).catch(() => {});
    }
  }
}
