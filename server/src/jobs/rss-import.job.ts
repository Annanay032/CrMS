import { pollRssFeeds } from '../services/rss.service.js';
import { logger } from '../config/logger.js';

export async function processRssFeeds() {
  logger.info('Starting RSS feed poll job');
  const count = await pollRssFeeds();
  logger.info(`RSS feed poll job completed: ${count} new ideas`);
  return count;
}
