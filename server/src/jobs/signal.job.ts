import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { emitToUser } from '../config/websocket.js';
import { SocialListeningAgent } from '../agents/listening.agent.js';
import * as crmService from '../services/crm.service.js';

const listeningAgent = new SocialListeningAgent();

export interface IntentAnalysisJobData {
  mentionIds: string[];
  queryId: string;
  userId: string;
}

export interface CrmSyncJobData {
  mentionId: string;
  userId: string;
  intent: string;
  opportunityScore: number;
}

export interface SignalProcessingJobData {
  mentionId: string;
  userId: string;
  intent: string;
  urgencyScore: number;
  influenceScore: number;
  opportunityScore: number;
  reason?: string;
}

/**
 * AI Intent Analysis Worker — classifies mentions by intent, urgency, influence, and opportunity.
 * Updates Mention records and enqueues CRM sync + signal creation for high-value mentions.
 */
export async function processIntentAnalysis(data: IntentAnalysisJobData) {
  const { mentionIds, queryId, userId } = data;

  const mentions = await prisma.mention.findMany({
    where: { id: { in: mentionIds }, queryId },
  });

  if (mentions.length === 0) {
    logger.info(`Signal pipeline: no mentions to analyze for query ${queryId}`);
    return;
  }

  try {
    const result = await listeningAgent.execute(userId, {
      action: 'analyze_intent',
      mentions: mentions.map((m) => ({
        id: m.id,
        content: m.content,
        platform: m.platform,
        source: m.source,
        authorFollowers: m.authorFollowers,
      })),
    });

    const analyzed = (result.output as { results?: Array<{
      index: number;
      intent: string;
      sentiment: string;
      urgencyScore: number;
      influenceScore: number;
      opportunityScore: number;
      reason?: string;
    }> })?.results ?? [];

    for (const item of analyzed) {
      const mention = mentions[item.index];
      if (!mention) continue;

      const validIntents = ['BUYING', 'QUESTION', 'COMPLAINT', 'PRAISE', 'COLLAB', 'OTHER'];
      const intent = validIntents.includes(item.intent) ? item.intent : 'OTHER';
      const urgencyScore = Math.max(0, Math.min(100, Math.round(item.urgencyScore ?? 0)));
      const influenceScore = Math.max(0, Math.min(100, Math.round(item.influenceScore ?? 0)));
      const opportunityScore = Math.max(0, Math.min(100, Math.round(item.opportunityScore ?? 0)));

      // Update mention with intent data
      await prisma.mention.update({
        where: { id: mention.id },
        data: {
          intent: intent as any,
          sentiment: (['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].includes(item.sentiment) ? item.sentiment : mention.sentiment) as any,
          urgencyScore,
          influenceScore,
          opportunityScore,
        },
      });

      // Create signal for significant mentions
      if (opportunityScore >= 50) {
        await processSignalCreation({
          mentionId: mention.id,
          userId,
          intent,
          urgencyScore,
          influenceScore,
          opportunityScore,
          reason: item.reason,
        });
      }

      // Auto-create CRM contact + deal for high-intent mentions
      if ((intent === 'BUYING' || intent === 'COLLAB') && opportunityScore >= 40) {
        await processCrmSync({
          mentionId: mention.id,
          userId,
          intent,
          opportunityScore,
        });
      }
    }

    logger.info(`Signal pipeline: analyzed ${analyzed.length} mentions for query ${queryId}`);
  } catch (err) {
    logger.error(`Signal pipeline: intent analysis failed for query ${queryId}`, err);
  }
}

/**
 * CRM Sync — auto-creates Contact and BrandDeal from a high-intent mention.
 */
export async function processCrmSync(data: CrmSyncJobData) {
  const { mentionId, userId, intent, opportunityScore } = data;

  const mention = await prisma.mention.findUnique({ where: { id: mentionId } });
  if (!mention || mention.isConverted) return;

  try {
    // Find or create contact
    const contact = await crmService.findOrCreateFromMention(userId, {
      source: mention.source,
      platform: mention.platform,
      content: mention.content,
      id: mention.id,
      authorFollowers: mention.authorFollowers,
    });

    // Find creator profile for the user to link the deal
    const creatorProfile = await prisma.creatorProfile.findFirst({ where: { userId } });

    if (creatorProfile) {
      // Create a deal at PROSPECT stage
      const dealValue = estimateDealValue(mention.authorFollowers, intent);
      await prisma.brandDeal.create({
        data: {
          creatorProfileId: creatorProfile.id,
          contactId: contact.id,
          brandName: mention.source ?? 'Unknown Brand',
          dealValue,
          probability: Math.min(opportunityScore, 80),
          expectedValue: dealValue * Math.min(opportunityScore, 80) / 100,
          status: 'PROSPECT',
          deliverables: [],
          notes: `Auto-created from ${mention.platform} mention: "${mention.content.slice(0, 200)}"`,
        },
      });
    }

    // Mark mention as converted
    await prisma.mention.update({
      where: { id: mentionId },
      data: { isConverted: true },
    });

    // Notify user via WebSocket
    emitToUser(userId, 'signal:crm-sync', {
      type: 'NEW_LEAD',
      contactId: contact.id,
      contactName: contact.name,
      platform: mention.platform,
      intent,
      message: `New ${intent.toLowerCase()} lead detected from @${mention.source ?? 'unknown'} on ${mention.platform}`,
    });

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: `New ${intent === 'BUYING' ? 'buying' : 'collaboration'} lead detected`,
        body: `@${mention.source ?? 'unknown'} on ${mention.platform} shows ${intent.toLowerCase()} intent. A contact and deal have been auto-created.`,
        metadata: { contactId: contact.id, mentionId },
      },
    });

    logger.info(`CRM sync: created contact ${contact.id} + deal from mention ${mentionId}`);
  } catch (err) {
    logger.error(`CRM sync failed for mention ${mentionId}`, err);
  }
}

/**
 * Signal Creation — creates a Signal record and notifies the user.
 */
export async function processSignalCreation(data: SignalProcessingJobData) {
  const { mentionId, userId, intent, opportunityScore, reason } = data;

  const mention = await prisma.mention.findUnique({ where: { id: mentionId } });
  if (!mention) return;

  try {
    const signalType = mapIntentToSignalType(intent, opportunityScore);
    const title = generateSignalTitle(intent, mention.source, mention.platform);

    const signal = await crmService.createSignal(userId, {
      type: signalType,
      title,
      description: reason ?? mention.content.slice(0, 500),
      sourceMentionId: mentionId,
      opportunityScore,
      metadata: {
        intent,
        platform: mention.platform,
        source: mention.source,
        authorFollowers: mention.authorFollowers,
      },
    });

    // Notify high-value signals in real-time
    if (opportunityScore >= 70) {
      emitToUser(userId, 'signal:high-value', {
        signalId: signal.id,
        type: signalType,
        title,
        opportunityScore,
      });
    }

    logger.info(`Signal created: ${signal.id} (${signalType}, score: ${opportunityScore})`);
  } catch (err) {
    logger.error(`Signal creation failed for mention ${mentionId}`, err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function mapIntentToSignalType(intent: string, score: number): string {
  if (intent === 'BUYING' || intent === 'COLLAB') return 'LEAD';
  if (intent === 'COMPLAINT') return 'RISK';
  if (score >= 80) return 'VIRAL_POST';
  return 'TREND';
}

function generateSignalTitle(intent: string, source: string | null, platform: string): string {
  const handle = source ? `@${source}` : 'Someone';
  switch (intent) {
    case 'BUYING': return `${handle} shows buying intent on ${platform}`;
    case 'COLLAB': return `${handle} interested in collaboration on ${platform}`;
    case 'COMPLAINT': return `Complaint detected from ${handle} on ${platform}`;
    case 'PRAISE': return `Positive mention from ${handle} on ${platform}`;
    case 'QUESTION': return `Question from ${handle} on ${platform}`;
    default: return `New mention from ${handle} on ${platform}`;
  }
}

function estimateDealValue(followers: number, intent: string): number {
  // Rough estimation based on follower count and intent
  const base = Math.max(1000, Math.round(followers * 0.1));
  const multiplier = intent === 'BUYING' ? 1.5 : 1;
  return Math.round(base * multiplier);
}
