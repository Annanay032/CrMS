import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { orchestrator } from '../agents/orchestrator.js';
import { AgentType } from '../types/enums.js';

/**
 * Process scheduled reports — find reports with status=SCHEDULED
 * and generate them if their schedule window has elapsed.
 */
export async function processScheduledReports() {
  const reports = await prisma.analyticsReport.findMany({
    where: { status: 'SCHEDULED', schedule: { not: null } },
  });

  let processed = 0;

  for (const report of reports) {
    try {
      // Simple check: if lastGeneratedAt is null or older than 24h, regenerate
      const shouldGenerate =
        !report.lastGeneratedAt ||
        Date.now() - report.lastGeneratedAt.getTime() > 24 * 60 * 60_000;

      if (!shouldGenerate) continue;

      await prisma.analyticsReport.update({
        where: { id: report.id },
        data: { status: 'GENERATING' },
      });

      const creatorProfileId = report.creatorProfileId;
      if (!creatorProfileId) {
        logger.warn(`Report ${report.id} has no creatorProfileId, skipping`);
        continue;
      }

      await orchestrator.run(AgentType.ANALYTICS, report.userId, {
        action: 'generate_report',
        creatorProfileId,
        reportId: report.id,
        metrics: report.metrics,
        dateRangeStart: report.dateRangeStart.toISOString(),
        dateRangeEnd: report.dateRangeEnd.toISOString(),
        platforms: report.platforms,
      });

      // Mark back as SCHEDULED for next cycle
      await prisma.analyticsReport.update({
        where: { id: report.id },
        data: { status: 'SCHEDULED' },
      });

      processed++;
    } catch (err) {
      logger.error(`Failed to process scheduled report ${report.id}`, err);
      await prisma.analyticsReport.update({
        where: { id: report.id },
        data: { status: 'SCHEDULED' },
      }).catch(() => {});
    }
  }

  logger.info(`Scheduled reports processed: ${processed}/${reports.length}`);
}
