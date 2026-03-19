import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

// ─── Google Business Profile Service ────────────────────────
// Stub implementation — requires Google My Business API v4 setup
// and OAuth2 consent for business.manage scope.

export interface GBPPost {
  summary: string;
  callToAction?: { actionType: string; url: string };
  mediaItems?: Array<{ mediaFormat: string; sourceUrl: string }>;
}

export interface GBPInsights {
  views: number;
  searches: number;
  actions: number;
  period: string;
}

export async function publishPost(
  accessToken: string,
  locationId: string,
  post: GBPPost,
): Promise<{ name: string }> {
  if (!env.GOOGLE_BUSINESS_CLIENT_ID) {
    throw new Error('Google Business Profile not configured');
  }

  const url = `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      languageCode: 'en',
      summary: post.summary,
      callToAction: post.callToAction,
      media: post.mediaItems?.map((m) => ({
        mediaFormat: m.mediaFormat,
        sourceUrl: m.sourceUrl,
      })),
      topicType: 'STANDARD',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`GBP publish failed: ${text}`);
    throw new Error(`GBP publish failed: ${res.status}`);
  }

  return (await res.json()) as { name: string };
}

export async function fetchInsights(
  accessToken: string,
  locationId: string,
): Promise<GBPInsights> {
  const url = `https://mybusiness.googleapis.com/v4/${locationId}/insights`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    logger.error(`GBP insights fetch failed: ${res.status}`);
    return { views: 0, searches: 0, actions: 0, period: 'UNKNOWN' };
  }

  const data = (await res.json()) as Record<string, unknown>;
  return {
    views: (data.views as number) ?? 0,
    searches: (data.searches as number) ?? 0,
    actions: (data.actions as number) ?? 0,
    period: 'LAST_30_DAYS',
  };
}

export async function fetchReviews(
  accessToken: string,
  locationId: string,
): Promise<Array<{ author: string; comment: string; rating: number; createTime: string }>> {
  const url = `https://mybusiness.googleapis.com/v4/${locationId}/reviews`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    logger.error(`GBP reviews fetch failed: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as { reviews?: Array<Record<string, unknown>> };
  return (data.reviews ?? []).map((r) => ({
    author: (r.reviewer as Record<string, string>)?.displayName ?? 'Anonymous',
    comment: (r.comment as string) ?? '',
    rating: (r.starRating as number) ?? 0,
    createTime: (r.createTime as string) ?? '',
  }));
}
