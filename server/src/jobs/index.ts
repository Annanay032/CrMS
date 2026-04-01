import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { prisma } from '../config/database.js';
import { publishScheduledPosts } from './publish.job.js';
import { fetchAnalytics } from './analytics.job.js';
import { scanTrends } from './trends.job.js';
import { pollMentions, analyzeMentionBatch } from './listening.job.js';
import { collectCompetitorData } from './competitive.job.js';
import { processScheduledReports } from './report.job.js';
import { runDailyGrowthRecommendations } from './growth.job.js';
import { pollEmailInboxes } from './inbox.job.js';
import { refreshExpiringTokens } from './token-refresh.job.js';
import { processRecurringPosts } from './recurring-post.job.js';
import { processRssFeeds } from './rss-import.job.js';
import { processSubscriptionExpiry } from './subscription.job.js';
import { postFirstComment } from './first-comment.job.js';
import type { FirstCommentJobData } from './first-comment.job.js';
import { processIntentAnalysis } from './signal.job.js';
import type { IntentAnalysisJobData } from './signal.job.js';
const connection = { connection: redis as any };

// Default job options with dead-letter handling
const defaultJobOpts = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 200 },
};

// ── Queues ──────────────────────────────────────────────────

export const publishQueue = new Queue('publish', { ...connection, defaultJobOptions: defaultJobOpts });
export const analyticsQueue = new Queue('analytics', { ...connection, defaultJobOptions: defaultJobOpts });
export const trendsQueue = new Queue('trends', { ...connection, defaultJobOptions: defaultJobOpts });
export const listeningQueue = new Queue('listening', { ...connection, defaultJobOptions: defaultJobOpts });
export const competitiveQueue = new Queue('competitive', { ...connection, defaultJobOptions: defaultJobOpts });
export const reportQueue = new Queue('reports', { ...connection, defaultJobOptions: defaultJobOpts });
export const growthQueue = new Queue('growth-daily', { ...connection, defaultJobOptions: defaultJobOpts });
export const inboxEmailQueue = new Queue('inbox-email-poll', { ...connection, defaultJobOptions: defaultJobOpts });
export const tokenRefreshQueue = new Queue('token-refresh', { ...connection, defaultJobOptions: defaultJobOpts });
export const recurringPostQueue = new Queue('recurring-posts', { ...connection, defaultJobOptions: defaultJobOpts });
export const rssImportQueue = new Queue('rss-import', { ...connection, defaultJobOptions: defaultJobOpts });
export const subscriptionQueue = new Queue('subscription-expiry', { ...connection, defaultJobOptions: defaultJobOpts });
export const firstCommentQueue = new Queue<FirstCommentJobData>('first-comment', { ...connection, defaultJobOptions: defaultJobOpts });
export const signalQueue = new Queue<IntentAnalysisJobData>('signal-pipeline', { ...connection, defaultJobOptions: defaultJobOpts });
export const cleanupQueue = new Queue('cleanup', { ...connection, defaultJobOptions: defaultJobOpts });

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

  const growthWorker = new Worker('growth-daily', async (job) => {
    logger.info(`Growth daily recommendation job ${job.id}`);
    await runDailyGrowthRecommendations();
  }, connection);

  const inboxEmailWorker = new Worker('inbox-email-poll', async (job) => {
    logger.info(`Inbox email poll job ${job.id}`);
    await pollEmailInboxes();
  }, connection);

  const tokenRefreshWorker = new Worker('token-refresh', async (job) => {
    logger.info(`Token refresh job ${job.id}`);
    await refreshExpiringTokens();
  }, connection);

  const recurringPostWorker = new Worker('recurring-posts', async (job) => {
    logger.info(`Recurring post job ${job.id}`);
    await processRecurringPosts();
  }, connection);

  const rssImportWorker = new Worker('rss-import', async (job) => {
    logger.info(`RSS import job ${job.id}`);
    await processRssFeeds();
  }, connection);

  const subscriptionWorker = new Worker('subscription-expiry', async (job) => {
    logger.info(`Subscription expiry job ${job.id}`);
    await processSubscriptionExpiry();
  }, connection);

  const firstCommentWorker = new Worker<FirstCommentJobData>('first-comment', async (job) => {
    logger.info(`First comment job ${job.id} (attempt ${job.data.attempt})`);
    await postFirstComment(job.data);
  }, {
    ...connection,
    settings: {
      backoffStrategy: () => 60_000, // 60s between retries
    },
  });

  growthWorker.on('failed', (job, err) => logger.error(`Growth job ${job?.id} failed`, err));
  inboxEmailWorker.on('failed', (job, err) => logger.error(`Inbox email job ${job?.id} failed`, err));
  tokenRefreshWorker.on('failed', (job, err) => logger.error(`Token refresh job ${job?.id} failed`, err));
  recurringPostWorker.on('failed', (job, err) => logger.error(`Recurring post job ${job?.id} failed`, err));
  rssImportWorker.on('failed', (job, err) => logger.error(`RSS import job ${job?.id} failed`, err));
  subscriptionWorker.on('failed', (job, err) => logger.error(`Subscription expiry job ${job?.id} failed`, err));
  firstCommentWorker.on('failed', (job, err) => {
    const data = job?.data;
    if (data && data.attempt < 5) {
      // Re-queue with incremented attempt and exponential backoff
      firstCommentQueue.add('post-first-comment', { ...data, attempt: data.attempt + 1 }, {
        delay: data.attempt * 60_000, // 1min, 2min, 3min, 4min
      });
      logger.info(`First comment retry scheduled for post ${data.postId} (attempt ${data.attempt + 1})`);
    } else {
      logger.error(`First comment job ${job?.id} failed permanently`, err);
    }
  });

  const signalWorker = new Worker<IntentAnalysisJobData>('signal-pipeline', async (job) => {
    logger.info(`Signal pipeline job ${job.id}`);
    await processIntentAnalysis(job.data);
  }, {
    ...connection,
    concurrency: 2,
  });

  signalWorker.on('failed', (job, err) => logger.error(`Signal pipeline job ${job?.id} failed`, err));

  // Stale data cleanup worker
  const cleanupWorker = new Worker('cleanup', async (job) => {
    logger.info(`Cleanup job ${job.id}`);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old agent usage logs (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const { count: usagePurged } = await prisma.agentUsageLog.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    // Delete old ignored signals (>30 days)
    const { count: signalsPurged } = await prisma.signal.deleteMany({
      where: { status: 'IGNORED', createdAt: { lt: thirtyDaysAgo } },
    });

    logger.info(`Cleanup: purged ${usagePurged} old usage logs, ${signalsPurged} ignored signals`);
  }, connection);

  cleanupWorker.on('failed', (job, err) => logger.error(`Cleanup job ${job?.id} failed`, err));

  logger.info('BullMQ workers started');
  return { publishWorker, analyticsWorker, trendsWorker, listeningWorker, competitiveWorker, reportWorker, growthWorker, inboxEmailWorker, tokenRefreshWorker, recurringPostWorker, rssImportWorker, subscriptionWorker, firstCommentWorker, signalWorker, cleanupWorker };
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

  // Daily growth recommendations at 6 AM IST (00:30 UTC)
  await growthQueue.upsertJobScheduler('growth-daily', {
    every: 24 * 60 * 60_000,
  }, {
    name: 'growth-daily-recs',
  });

  // Poll email inboxes every 5 minutes
  await inboxEmailQueue.upsertJobScheduler('inbox-email-poll', {
    every: 5 * 60_000,
  }, {
    name: 'inbox-email-periodic',
  });

  // Refresh expiring OAuth tokens daily
  await tokenRefreshQueue.upsertJobScheduler('token-refresh', {
    every: 24 * 60 * 60_000,
  }, {
    name: 'token-refresh-daily',
  });

  // Process recurring/evergreen posts every 30 minutes
  await recurringPostQueue.upsertJobScheduler('recurring-post-check', {
    every: 30 * 60_000,
  }, {
    name: 'recurring-post-process',
  });

  // Poll RSS feeds every hour
  await rssImportQueue.upsertJobScheduler('rss-import-poll', {
    every: 60 * 60_000,
  }, {
    name: 'rss-import-periodic',
  });

  // Check subscription trials/cancellations daily
  await subscriptionQueue.upsertJobScheduler('subscription-expiry-check', {
    every: 24 * 60 * 60_000,
  }, {
    name: 'subscription-expiry-daily',
  });

  // Stale data cleanup daily
  await cleanupQueue.upsertJobScheduler('cleanup-daily', {
    every: 24 * 60 * 60_000,
  }, {
    name: 'cleanup-stale-data',
  });

  logger.info('Recurring jobs scheduled');
}
