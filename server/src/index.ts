import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { configurePassport } from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { startWorkers, scheduleRecurringJobs } from './jobs/index.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('short', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// Passport
configurePassport();
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(env.API_PREFIX, routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful startup
async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await redis.ping();
    logger.info('Redis connected');

    app.listen(env.PORT, () => {
      logger.info(`CrMS API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Start background job workers
    startWorkers();
    await scheduleRecurringJobs();
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export default app;
