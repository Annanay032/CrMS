import { createHash, randomBytes } from 'crypto';
import type { Response, NextFunction } from 'express';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

/**
 * Generates a new API key and returns both the raw key (shown once) and its hash.
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawKey = `crms_k1_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 16);
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hashes a raw API key for lookup.
 */
function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Middleware that authenticates requests via API key in the Authorization header.
 * Format: Authorization: Bearer crms_k1_...
 */
export function authenticateApiKey(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer crms_k1_')) {
    res.status(401).json({ success: false, error: 'Missing or invalid API key' });
    return;
  }

  const rawKey = header.slice(7); // Remove "Bearer "
  const keyHash = hashKey(rawKey);

  prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  })
    .then(async (apiKey) => {
      if (!apiKey || !apiKey.isActive) {
        res.status(401).json({ success: false, error: 'Invalid or deactivated API key' });
        return;
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        res.status(401).json({ success: false, error: 'API key has expired' });
        return;
      }

      // Update last used timestamp (fire and forget)
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => { /* ignore */ });

      req.user = {
        userId: apiKey.userId,
        email: apiKey.user.email,
        role: apiKey.user.role as any,
      };

      // Store scopes on the request for authorization
      (req as any).apiKeyScopes = apiKey.scopes;

      next();
    })
    .catch(() => {
      res.status(500).json({ success: false, error: 'API key validation failed' });
    });
}

/**
 * Middleware to check if the API key has a required scope.
 */
export function requireScope(...scopes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const keyScopes = (req as any).apiKeyScopes as string[] | undefined;
    if (!keyScopes) {
      res.status(403).json({ success: false, error: 'No scopes available' });
      return;
    }

    const hasScope = scopes.some((s) => keyScopes.includes(s));
    if (!hasScope) {
      res.status(403).json({ success: false, error: `Required scope: ${scopes.join(' or ')}` });
      return;
    }

    next();
  };
}
