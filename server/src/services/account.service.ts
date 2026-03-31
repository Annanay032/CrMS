import { prisma } from '../config/index.js';
import { env } from '../config/env.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import type { OAuthProvider } from '../types/enums.js';
import type { Platform } from '@prisma/client';

// ─── Platform OAuth config ──────────────────────────────────
interface PlatformOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: string[];
}

function getPlatformConfig(provider: string): PlatformOAuthConfig | null {
  switch (provider) {
    case 'INSTAGRAM':
      if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET || !env.INSTAGRAM_CALLBACK_URL) return null;
      return {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        clientId: env.INSTAGRAM_APP_ID,
        clientSecret: env.INSTAGRAM_APP_SECRET,
        callbackUrl: env.INSTAGRAM_CALLBACK_URL,
        scopes: ['user_profile', 'user_media', 'instagram_manage_insights'],
      };
    case 'YOUTUBE':
      if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_CALLBACK_URL) return null;
      return {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: env.YOUTUBE_CLIENT_ID,
        clientSecret: env.YOUTUBE_CLIENT_SECRET,
        callbackUrl: env.YOUTUBE_CALLBACK_URL,
        scopes: [
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
        ],
      };
    case 'TIKTOK':
      if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET || !env.TIKTOK_CALLBACK_URL) return null;
      return {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        clientId: env.TIKTOK_CLIENT_KEY,
        clientSecret: env.TIKTOK_CLIENT_SECRET,
        callbackUrl: env.TIKTOK_CALLBACK_URL,
        scopes: ['user.info.basic', 'video.list'],
      };
    case 'TWITTER':
      if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET || !env.TWITTER_CALLBACK_URL) return null;
      return {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        clientId: env.TWITTER_CLIENT_ID,
        clientSecret: env.TWITTER_CLIENT_SECRET,
        callbackUrl: env.TWITTER_CALLBACK_URL,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      };
    case 'LINKEDIN':
      if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET || !env.LINKEDIN_CALLBACK_URL) return null;
      return {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        callbackUrl: env.LINKEDIN_CALLBACK_URL,
        scopes: ['openid', 'profile', 'w_member_social'],
      };
    case 'FACEBOOK':
      if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET || !env.FACEBOOK_CALLBACK_URL) return null;
      return {
        authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
        clientId: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET,
        callbackUrl: env.FACEBOOK_CALLBACK_URL,
        scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'read_insights'],
      };
    case 'THREADS':
      // Threads uses Instagram's Graph API (same Meta OAuth)
      if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET || !env.INSTAGRAM_CALLBACK_URL) return null;
      return {
        authUrl: 'https://threads.net/oauth/authorize',
        tokenUrl: 'https://graph.threads.net/oauth/access_token',
        clientId: env.INSTAGRAM_APP_ID,
        clientSecret: env.INSTAGRAM_APP_SECRET,
        callbackUrl: env.INSTAGRAM_CALLBACK_URL,
        scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_insights'],
      };
    case 'PINTEREST':
      if (!env.PINTEREST_APP_ID || !env.PINTEREST_APP_SECRET || !env.PINTEREST_CALLBACK_URL) return null;
      return {
        authUrl: 'https://www.pinterest.com/oauth/',
        tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
        clientId: env.PINTEREST_APP_ID,
        clientSecret: env.PINTEREST_APP_SECRET,
        callbackUrl: env.PINTEREST_CALLBACK_URL,
        scopes: ['boards:read', 'pins:read', 'pins:write', 'pins:read_secret', 'user_accounts:read'],
      };
    case 'MASTODON':
      if (!env.MASTODON_CLIENT_ID || !env.MASTODON_CLIENT_SECRET || !env.MASTODON_CALLBACK_URL) return null;
      return {
        authUrl: `${env.MASTODON_INSTANCE_URL ?? 'https://mastodon.social'}/oauth/authorize`,
        tokenUrl: `${env.MASTODON_INSTANCE_URL ?? 'https://mastodon.social'}/oauth/token`,
        clientId: env.MASTODON_CLIENT_ID,
        clientSecret: env.MASTODON_CLIENT_SECRET,
        callbackUrl: env.MASTODON_CALLBACK_URL,
        scopes: ['read', 'write'],
      };
    default:
      return null;
  }
}

// ─── Get connected accounts for a user ──────────────────────
export async function getConnectedAccounts(userId: string) {
  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      expiresAt: true,
      paused: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Also get CreatorPlatformStats for enrichment
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: { platformStats: true },
  });

  // Get distinct platforms from the user's content posts
  const contentPlatforms = creatorProfile
    ? await prisma.contentPost.findMany({
        where: { creatorProfileId: creatorProfile.id },
        select: { platform: true },
        distinct: ['platform'],
      })
    : [];

  const oauthAccounts = accounts
    .filter((a) => a.provider !== 'GOOGLE') // Google is auth, not a social platform connection
    .map((account) => {
      const stats = creatorProfile?.platformStats?.find(
        (s) => s.platform === account.provider,
      );
      return {
        id: account.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        connected: true,
        connectedAt: account.createdAt,
        expiresAt: account.expiresAt,
        isExpired: account.expiresAt ? new Date(account.expiresAt) < new Date() : false,
        paused: account.paused,
        stats: stats
          ? {
              handle: stats.handle,
              followers: stats.followers,
              engagementRate: stats.engagementRate,
              avgLikes: stats.avgLikes,
              avgComments: stats.avgComments,
              avgViews: stats.avgViews,
            }
          : null,
      };
    });

  // Add content-only platforms (platforms with posts but no OAuth connection)
  const oauthProviders = new Set(oauthAccounts.map((a) => a.provider));
  for (const cp of contentPlatforms) {
    if (!oauthProviders.has(cp.platform)) {
      const stats = creatorProfile?.platformStats?.find(
        (s) => s.platform === cp.platform,
      );
      oauthAccounts.push({
        id: `content-${cp.platform.toLowerCase()}`,
        provider: cp.platform,
        providerAccountId: '',
        connected: true,
        connectedAt: new Date(),
        expiresAt: null,
        isExpired: false,
        paused: false,
        stats: stats
          ? {
              handle: stats.handle,
              followers: stats.followers,
              engagementRate: stats.engagementRate,
              avgLikes: stats.avgLikes,
              avgComments: stats.avgComments,
              avgViews: stats.avgViews,
            }
          : null,
      });
    }
  }

  return oauthAccounts;
}

// ─── Check which platforms are available for OAuth ──────────
export function getAvailablePlatforms() {
  const platforms = [
    { provider: 'INSTAGRAM', manualConnectAvailable: true },
    { provider: 'YOUTUBE', manualConnectAvailable: true },
    { provider: 'TIKTOK', manualConnectAvailable: true },
    { provider: 'TWITTER', manualConnectAvailable: true },
    { provider: 'LINKEDIN', manualConnectAvailable: true },
    { provider: 'THREADS', manualConnectAvailable: true },
    { provider: 'BLUESKY', manualConnectAvailable: true },
    { provider: 'FACEBOOK', manualConnectAvailable: true },
    { provider: 'PINTEREST', manualConnectAvailable: true },
    { provider: 'MASTODON', manualConnectAvailable: true },
  ] as const;
  return platforms.map((p) => ({
    provider: p.provider,
    oauthConfigured: getPlatformConfig(p.provider) !== null,
    manualConnectAvailable: p.manualConnectAvailable,
  }));
}

// ─── Generate OAuth authorization URL ───────────────────────
export function getOAuthUrl(provider: string, userId: string): string | null {
  const config = getPlatformConfig(provider);
  if (!config) return null;

  // Encode userId + provider in state for CSRF protection + identification
  const statePayload = Buffer.from(JSON.stringify({ userId, provider, ts: Date.now() })).toString('base64url');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: config.scopes.join(provider === 'TIKTOK' ? ',' : ' '),
    response_type: 'code',
    state: statePayload,
  });

  if (provider === 'YOUTUBE') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  if (provider === 'TWITTER') {
    // Twitter OAuth 2.0 with PKCE
    params.set('code_challenge', 'challenge');
    params.set('code_challenge_method', 'plain');
  }

  if (provider === 'LINKEDIN') {
    params.set('response_type', 'code');
  }

  return `${config.authUrl}?${params.toString()}`;
}

// ─── Handle OAuth callback — exchange code for tokens ───────
export async function handleOAuthCallback(provider: string, code: string, state: string) {
  // Decode + validate state
  const stateData = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
    userId: string;
    provider: string;
    ts: number;
  };

  // Validate state isn't too old (15 minutes)
  if (Date.now() - stateData.ts > 15 * 60 * 1000) {
    throw Object.assign(new Error('OAuth state expired'), { statusCode: 400 });
  }

  if (stateData.provider !== provider) {
    throw Object.assign(new Error('Provider mismatch in state'), { statusCode: 400 });
  }

  const config = getPlatformConfig(provider);
  if (!config) throw Object.assign(new Error('Platform not configured'), { statusCode: 400 });

  // Exchange code for token
  const tokenParams: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.callbackUrl,
  };

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(tokenParams),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw Object.assign(new Error(`Token exchange failed: ${errorBody}`), { statusCode: 400 });
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: string;
    open_id?: string;
  };

  // Determine provider account ID
  let providerAccountId = tokenData.user_id || tokenData.open_id || '';
  if (!providerAccountId && provider === 'YOUTUBE') {
    // For YouTube, fetch the channel ID
    providerAccountId = await fetchYouTubeChannelId(tokenData.access_token);
  }

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;

  // Store account with encrypted tokens
  return upsertOAuthAccount(
    stateData.userId,
    provider as OAuthProvider,
    providerAccountId,
    tokenData.access_token,
    tokenData.refresh_token ?? null,
    expiresAt,
  );
}

async function fetchYouTubeChannelId(accessToken: string): Promise<string> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return `yt_${Date.now()}`;
  const data = (await res.json()) as { items?: Array<{ id: string }> };
  return data.items?.[0]?.id ?? `yt_${Date.now()}`;
}

// ─── Manual connect (for dev or simple handle linking) ──────
export async function manualConnect(
  userId: string,
  provider: OAuthProvider,
  handle: string,
  accessToken?: string,
) {
  const providerAccountId = `manual_${handle.replace(/^@/, '')}`;

  const account = await upsertOAuthAccount(
    userId,
    provider,
    providerAccountId,
    accessToken ?? `manual_token_${Date.now()}`,
    null,
    null,
  );

  // Sync platform stats to creator profile
  await syncPlatformStats(userId, provider, handle);

  return account;
}

// ─── Shared upsert logic ────────────────────────────────────
async function upsertOAuthAccount(
  userId: string,
  provider: OAuthProvider,
  providerAccountId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
) {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  // Check if this provider account is already linked to another user
  const existing = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });

  if (existing && existing.userId !== userId) {
    throw Object.assign(
      new Error('This account is already linked to a different user'),
      { statusCode: 409 },
    );
  }

  // Check if user already has this provider linked (different account)
  const userExisting = await prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (userExisting && userExisting.providerAccountId !== providerAccountId) {
    // Replace the old account
    await prisma.oAuthAccount.delete({ where: { id: userExisting.id } });
  }

  const account = await prisma.oAuthAccount.upsert({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
    },
    create: {
      userId,
      provider,
      providerAccountId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
    },
  });

  return {
    id: account.id,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    connectedAt: account.createdAt,
    expiresAt: account.expiresAt,
  };
}

// ─── Sync platform stats to CreatorProfile ──────────────────
async function syncPlatformStats(
  userId: string,
  provider: OAuthProvider,
  handle: string,
) {
  // GOOGLE is auth-only, not a content platform
  if (provider === 'GOOGLE') return;

  const platformValue = provider as unknown as Platform;
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId },
  });
  if (!creatorProfile) return; // Only sync for creators

  await prisma.creatorPlatformStats.upsert({
    where: {
      creatorProfileId_platform: {
        creatorProfileId: creatorProfile.id,
        platform: platformValue,
      },
    },
    update: { handle },
    create: {
      creatorProfileId: creatorProfile.id,
      platform: platformValue,
      handle,
      followers: 0,
      avgLikes: 0,
      avgComments: 0,
      avgViews: 0,
      engagementRate: 0,
    },
  });
}

// ─── Disconnect account ─────────────────────────────────────
export async function disconnectAccount(userId: string, provider: OAuthProvider) {
  const account = await prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (!account) {
    throw Object.assign(new Error('Account not connected'), { statusCode: 404 });
  }

  await prisma.oAuthAccount.delete({ where: { id: account.id } });

  return { provider, disconnected: true };
}

// ─── Toggle pause on account ────────────────────────────────
export async function toggleAccountPause(userId: string, provider: OAuthProvider) {
  const account = await prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (!account) {
    throw Object.assign(new Error('Account not connected'), { statusCode: 404 });
  }

  const updated = await prisma.oAuthAccount.update({
    where: { id: account.id },
    data: { paused: !account.paused },
    select: { provider: true, paused: true },
  });

  return { provider: updated.provider, paused: updated.paused };
}

// ─── Refresh OAuth token ────────────────────────────────────
export async function refreshAccountToken(userId: string, provider: OAuthProvider) {
  const account = await prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (!account) {
    throw Object.assign(new Error('Account not connected'), { statusCode: 404 });
  }

  if (!account.refreshToken) {
    throw Object.assign(new Error('No refresh token available'), { statusCode: 400 });
  }

  const config = getPlatformConfig(provider);
  if (!config) {
    throw Object.assign(new Error('Platform not configured for token refresh'), { statusCode: 400 });
  }

  const decryptedRefreshToken = decrypt(account.refreshToken);

  const tokenParams: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: decryptedRefreshToken,
    grant_type: 'refresh_token',
  };

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(tokenParams),
  });

  if (!tokenResponse.ok) {
    throw Object.assign(new Error('Token refresh failed'), { statusCode: 400 });
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;

  await prisma.oAuthAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encrypt(tokenData.access_token),
      refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
      expiresAt,
    },
  });

  return { provider, refreshed: true, expiresAt };
}
