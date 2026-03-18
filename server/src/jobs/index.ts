import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { publishScheduledPosts } from './publish.job.js';
import { fetchAnalytics } from './analytics.job.js';
import { scanTrends } from './trends.job.js';

const connection = { connection: redis as any };

// ── Queues ──────────────────────────────────────────────────

export const publishQueue = new Queue('publish', connection);
export const analyticsQueue = new Queue('analytics', connection);
export const trendsQueue = new Queue('trends', connection);

// ── Workers ─────────────────────────────────────────────────

export function startWorkers() {
  const publishWorker = new Worker('publish', async (job) => {
    logger.info(`Publishing job ${job.id}`);
    await publishScheduledPosts();
  }, connection);

  const analyticsWorker = new Worker('analytics', async (job) => {
    logger.info(`Analytics fetch job ${job.id}`);
    await fetchAnalytics();
  }, connection);

  const trendsWorker = new Worker('trends', async (job) => {
    logger.info(`Trends scan job ${job.id}`);
    await scanTrends(job.data as { niche: string[]; platforms: string[] });
  }, connection);

  publishWorker.on('failed', (job, err) => logger.error(`Publish job ${job?.id} failed`, err));
  analyticsWorker.on('failed', (job, err) => logger.error(`Analytics job ${job?.id} failed`, err));
  trendsWorker.on('failed', (job, err) => logger.error(`Trends job ${job?.id} failed`, err));

  logger.info('BullMQ workers started');
  return { publishWorker, analyticsWorker, trendsWorker };
}

// ── Scheduled (repeating) jobs ──────────────────────────────

export async function scheduleRecurringJobs() {
  // Check for posts to publish every minute
  await publishQueue.upsertJobScheduler('publish-check', {
    every: 60_000,
  }, {
    name: 'publish-scheduled',
  });

  // Fetch analytics every 6 hours
  await analyticsQueue.upsertJobScheduler('analytics-fetch', {
    every: 6 * 60 * 60_000,
  }, {
    name: 'analytics-periodic',
  });

  logger.info('Recurring jobs scheduled');
}
