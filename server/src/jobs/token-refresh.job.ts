import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';

export async function refreshExpiringTokens() {
  logger.info('[token-refresh] Checking for expiring OAuth tokens');

  const threshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const accounts = await prisma.oAuthAccount.findMany({
    where: {
      expiresAt: { lte: threshold },
      refreshToken: { not: null },
    },
  });

  for (const account of accounts) {
    try {
      let tokenUrl: string;
      let body: URLSearchParams;

      switch (account.provider) {
        case 'GOOGLE':
        case 'YOUTUBE':
          tokenUrl = 'https://oauth2.googleapis.com/token';
          body = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID ?? '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            refresh_token: account.refreshToken!,
            grant_type: 'refresh_token',
          });
          break;
        case 'INSTAGRAM':
          tokenUrl = 'https://graph.instagram.com/refresh_access_token';
          body = new URLSearchParams({
            grant_type: 'ig_refresh_token',
            access_token: account.accessToken,
          });
          break;
        case 'TIKTOK':
          tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
          body = new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET ?? '',
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken!,
          });
          break;
        default:
          logger.warn(`[token-refresh] Unsupported provider ${account.provider}`);
          continue;
      }

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        logger.warn(`[token-refresh] Refresh failed for ${account.provider} account ${account.id}: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };

      if (data.access_token) {
        await prisma.oAuthAccount.update({
          where: { id: account.id },
          data: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? account.refreshToken,
            expiresAt: data.expires_in
              ? new Date(Date.now() + data.expires_in * 1000)
              : undefined,
          },
        });
        logger.info(`[token-refresh] Refreshed ${account.provider} token for account ${account.id}`);
      }
    } catch (err) {
      logger.error(`[token-refresh] Error refreshing account ${account.id}`, err);
    }
  }
}
