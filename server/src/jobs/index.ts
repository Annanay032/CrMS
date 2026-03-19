import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { publishScheduledPosts } from './publish.job.js';
import { fetchAnalytics } from './analytics.job.js';
import { scanTrends } from './trends.job.js';
import { pollMentions, analyzeMentionBatch } from './listening.job.js';
import { collectCompetitorData } from './competitive.job.js';
import { processScheduledReports } from './report.job.js';
const connection = { connection: redis as any };

// ── Queues ──────────────────────────────────────────────────

export const publishQueue = new Queue('publish', connection);
export const analyticsQueue = new Queue('analytics', connection);
export const trendsQueue = new Queue('trends', connection);
export const listeningQueue = new Queue('listening', connection);
export const competitiveQueue = new Queue('competitive', connection);
export const reportQueue = new Queue('reports', connection);

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

  const listeningWorker = new Worker('listening', async (job) => {
    logger.info(`Listening job ${job.id}`);
    if (job.name === 'analyze-batch') {
      await analyzeMentionBatch(job.data as { queryId: string; userId: string });
    } else {
      await pollMentions();
    }
  }, connection);

  const competitiveWorker = new Worker('competitive', async (job) => {
    logger.info(`Competitive data collection job ${job.id}`);
    await collectCompetitorData();
  }, connection);

  const reportWorker = new Worker('reports', async (job) => {
    logger.info(`Report generation job ${job.id}`);
    await processScheduledReports();
  }, connection);

  publishWorker.on('failed', (job, err) => logger.error(`Publish job ${job?.id} failed`, err));
  analyticsWorker.on('failed', (job, err) => logger.error(`Analytics job ${job?.id} failed`, err));
  trendsWorker.on('failed', (job, err) => logger.error(`Trends job ${job?.id} failed`, err));
  listeningWorker.on('failed', (job, err) => logger.error(`Listening job ${job?.id} failed`, err));
  competitiveWorker.on('failed', (job, err) => logger.error(`Competitive job ${job?.id} failed`, err));
  reportWorker.on('failed', (job, err) => logger.error(`Report job ${job?.id} failed`, err));

  logger.info('BullMQ workers started');
  return { publishWorker, analyticsWorker, trendsWorker, listeningWorker, competitiveWorker, reportWorker };
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

  // Poll listening queries every 15 minutes
  await listeningQueue.upsertJobScheduler('listening-poll', {
    every: 15 * 60_000,
  }, {
    name: 'listening-periodic',
  });

  // Collect competitor data daily
  await competitiveQueue.upsertJobScheduler('competitive-collect', {
    every: 24 * 60 * 60_000,
  }, {
    name: 'competitive-daily',
  });

  // Process scheduled reports every 6 hours
  await reportQueue.upsertJobScheduler('report-process', {
    every: 6 * 60 * 60_000,
  }, {
    name: 'report-scheduled',
  });

  logger.info('Recurring jobs scheduled');
}
