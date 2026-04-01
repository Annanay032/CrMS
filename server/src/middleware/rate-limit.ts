import rateLimit from 'express-rate-limit';

/**
 * Stricter rate limiter for auth routes (login, register).
 * Prevents brute-force / credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Please wait 15 minutes.' },
});

/**
 * Rate limiter for AI agent endpoints that consume expensive API calls.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'AI rate limit reached. Please slow down.' },
});

/**
 * Rate limiter for file upload endpoints.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Upload rate limit reached. Please wait.' },
});
