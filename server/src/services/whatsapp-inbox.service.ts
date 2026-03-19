import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { getIO } from '../config/websocket.js';

/**
 * WhatsApp Inbox Service — webhook receiver for Meta Cloud API.
 * Converts incoming WhatsApp messages into CommunityInteractions.
 */

export async function handleWhatsAppWebhook(body: {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
        contacts?: Array<{
          profile?: { name: string };
          wa_id: string;
        }>;
        metadata?: {
          phone_number_id: string;
        };
      };
    }>;
  }>;
}) {
  const created: string[] = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const phoneNumberId = value.metadata?.phone_number_id;

      // Find the creator who owns this WhatsApp channel
      const channel = await prisma.inboxChannel.findFirst({
        where: {
          type: 'WHATSAPP',
          config: { path: ['phoneNumberId'], equals: phoneNumberId },
        },
      });
      if (!channel) {
        logger.warn(`[whatsapp] No channel found for phone_number_id ${phoneNumberId}`);
        continue;
      }

      for (const msg of value.messages) {
        // Deduplicate
        const existing = await prisma.communityInteraction.findFirst({
          where: { creatorProfileId: channel.creatorProfileId, externalId: msg.id },
        });
        if (existing) continue;

        const contact = value.contacts?.find(c => c.wa_id === msg.from);

        const interaction = await prisma.communityInteraction.create({
          data: {
            creatorProfileId: channel.creatorProfileId,
            platform: 'INSTAGRAM', // reuse — WhatsApp doesn't map to Platform enum
            interactionType: 'WHATSAPP',
            externalId: msg.id,
            authorName: contact?.profile?.name ?? msg.from,
            content: msg.text?.body ?? `[${msg.type}]`,
            threadId: msg.from, // group by sender
            channelMetadata: {
              type: 'whatsapp',
              from: msg.from,
              phoneNumberId,
              messageType: msg.type,
            },
          },
        });

        created.push(interaction.id);

        // Real-time notification
        const io = getIO();
        if (io) {
          const creator = await prisma.creatorProfile.findUnique({
            where: { id: channel.creatorProfileId },
            select: { userId: true },
          });
          if (creator) {
            io.to(`user:${creator.userId}`).emit('inbox:new', {
              id: interaction.id,
              type: 'WHATSAPP',
              from: contact?.profile?.name ?? msg.from,
              preview: (msg.text?.body ?? '').slice(0, 100),
            });
          }
        }
      }
    }
  }

  logger.info(`[whatsapp] Processed ${created.length} new messages`);
  return created;
}

/** Verify webhook — Meta sends a GET with hub.verify_token */
export function verifyWebhook(query: { 'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string }) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? 'crms_whatsapp_verify';
  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === VERIFY_TOKEN) {
    return query['hub.challenge'] ?? '';
  }
  return null;
}
