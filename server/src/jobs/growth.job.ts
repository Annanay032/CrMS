import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { GrowthAgent } from '../agents/growth.agent.js';

const growthAgent = new GrowthAgent();

export async function runDailyGrowthRecommendations() {
  logger.info('[growth-job] Running daily growth recommendations');

  const creators = await prisma.creatorProfile.findMany({
    where: { user: { role: 'CREATOR' } },
    include: {
      user: { select: { id: true, name: true } },
      platformStats: true,
    },
  });

  for (const creator of creators) {
    try {
      const result = await growthAgent.execute(creator.userId, {
        action: 'daily',
        creatorProfileId: creator.id,
        niche: creator.niche,
        platforms: creator.platformStats.map((ps) => ps.platform),
      });

      // Store as notification
      await prisma.notification.create({
        data: {
          userId: creator.userId,
          type: 'DAILY_RECOMMENDATION',
          title: 'Daily Growth Recommendation',
          body: (result.output as any)?.title ?? 'New recommendation ready',
          data: result.output as any,
        },
      });

      logger.info(`[growth-job] Recommendation generated for creator ${creator.id}`);
    } catch (err) {
      logger.error(`[growth-job] Failed for creator ${creator.id}`, err);
    }
  }
}
