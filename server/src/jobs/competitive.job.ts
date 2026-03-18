import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import * as competitiveService from '../services/competitive.service.js';

export async function collectCompetitorData() {
  const competitors = await prisma.competitor.findMany({
    where: { isActive: true },
  });

  logger.info(`Competitive job: collecting data for ${competitors.length} competitors`);

  for (const competitor of competitors) {
    for (const platform of competitor.platforms) {
      try {
        // In production, this would call platform APIs to fetch real metrics.
        // For now, we create a snapshot placeholder that can be populated
        // by external data sources or manual entry via the API.
        const existing = await prisma.competitorSnapshot.findFirst({
          where: {
            competitorId: competitor.id,
            platform,
          },
          orderBy: { date: 'desc' },
        });

        if (existing) {
          // Re-snapshot with latest data (would be from API in production)
          await competitiveService.upsertSnapshot({
            competitorId: competitor.id,
            platform,
            followers: existing.followers,
            engagementRate: existing.engagementRate,
            postFrequency: existing.postFrequency,
            topContentTypes: existing.topContentTypes,
            topHashtags: existing.topHashtags,
            avgLikes: existing.avgLikes,
            avgComments: existing.avgComments,
          });
        }

        logger.info(`Snapshot updated for competitor "${competitor.name}" on ${platform}`);
      } catch (err) {
        logger.error(`Failed to collect data for competitor ${competitor.id} on ${platform}`, err);
      }
    }
  }
}
