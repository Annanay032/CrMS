import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { SocialListeningAgent } from '../agents/listening.agent.js';
import * as listeningService from '../services/listening.service.js';
import { signalQueue } from './index.js';

const listeningAgent = new SocialListeningAgent();

export async function pollMentions() {
  const activeQueries = await prisma.listeningQuery.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true } } },
  });

  logger.info(`Listening job: polling ${activeQueries.length} active queries`);

  for (const query of activeQueries) {
    try {
      // In production, this would call platform APIs (e.g. Twitter Search API, Instagram Graph API)
      // For now, log that we'd poll here. The actual mention ingestion happens
      // when platform webhooks or external services push data via the ingest endpoint.
      logger.info(`Polling mentions for query "${query.name}" (${query.keywords.join(', ')})`);

      // Update sentiment snapshot for today
      await listeningService.upsertSentimentSnapshot(query.id);

      // Enqueue unanalyzed mentions for the Signal Engine intent analysis
      const unanalyzedMentions = await prisma.mention.findMany({
        where: {
          queryId: query.id,
          intent: null,
          detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
        take: 50,
      });

      if (unanalyzedMentions.length > 0) {
        await signalQueue.add('analyze-intent', {
          mentionIds: unanalyzedMentions.map((m) => m.id),
          queryId: query.id,
          userId: query.user.id,
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
        logger.info(`Enqueued ${unanalyzedMentions.length} mentions for intent analysis (query ${query.id})`);
      }

      logger.info(`Sentiment snapshot updated for query ${query.id}`);
    } catch (err) {
      logger.error(`Failed to poll query ${query.id}`, err);
    }
  }
}

export async function analyzeMentionBatch(data: { queryId: string; userId: string }) {
  const { queryId, userId } = data;

  // Fetch un-analyzed recent mentions (last 24h without sentiment)
  const recentMentions = await prisma.mention.findMany({
    where: {
      queryId,
      sentiment: 'NEUTRAL', // Default — re-analyze these
      detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    take: 50,
    orderBy: { detectedAt: 'desc' },
  });

  if (recentMentions.length === 0) {
    logger.info(`No mentions to analyze for query ${queryId}`);
    return;
  }

  const query = await prisma.listeningQuery.findUnique({ where: { id: queryId } });
  if (!query) return;

  try {
    const result = await listeningAgent.execute(userId, {
      action: 'sentiment_breakdown',
      mentions: recentMentions.map((m) => ({
        content: m.content,
        platform: m.platform,
        source: m.source,
      })),
    });

    const analyzed = (result.output as { results?: Array<{ index: number; sentiment: string }> })?.results ?? [];

    // Batch update sentiments
    for (const item of analyzed) {
      const mention = recentMentions[item.index];
      if (mention && ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].includes(item.sentiment)) {
        await prisma.mention.update({
          where: { id: mention.id },
          data: { sentiment: item.sentiment as any },
        });
      }
    }

    // Update snapshot
    await listeningService.upsertSentimentSnapshot(queryId);

    logger.info(`Analyzed ${analyzed.length} mentions for query ${queryId}`);
  } catch (err) {
    logger.error(`Mention analysis failed for query ${queryId}`, err);
  }
}
