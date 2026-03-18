import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack });

  const status = 'statusCode' in err ? (err as Error & { statusCode: number }).statusCode : 500;
  res.status(status).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: 'Route not found' });
}
