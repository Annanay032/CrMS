import { createServer } from 'http';
import path from 'path';
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
import { setupWebSocket } from './config/websocket.js';
import { configurePassport } from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { startWorkers, scheduleRecurringJobs } from './jobs/index.js';
import { wireOrchestratorEvents } from './services/notification.service.js';
import { bullBoardAdapter } from './config/bull-board.js';

const app = express();
const httpServer = createServer(app);

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", env.CLIENT_URL, 'wss:', 'https://api.openai.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow cross-origin images
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'development' ? 1000 : 200,
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

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(env.API_PREFIX, routes);

// Bull Board (admin queue dashboard) — protected by basic auth in production
app.use('/admin/queues', bullBoardAdapter.getRouter());

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

    setupWebSocket(httpServer);
    wireOrchestratorEvents();

    httpServer.listen(env.PORT, () => {
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
