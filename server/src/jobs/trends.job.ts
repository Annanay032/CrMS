import { logger } from '../config/logger.js';
import { TrendDetectionAgent } from '../agents/trends.agent.js';

const trendAgent = new TrendDetectionAgent();

export async function scanTrends(data: { niche: string[]; platforms: string[] }) {
  try {
    const result = await trendAgent.run({
      niche: data.niche,
      platforms: data.platforms,
    });
    logger.info('Trend scan complete', { trendsFound: (result.output as any)?.trends?.length ?? 0 });
    return result;
  } catch (err) {
    logger.error('Trend scan failed', err);
    throw err;
  }
}
