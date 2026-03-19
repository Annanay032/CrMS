import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';

const CACHE_TTL = 3600; // 1 hour

// ─── Google Trends (via google-trends-api or fallback) ───────

export async function getGoogleTrends(keywords: string[], geo: string = 'IN'): Promise<unknown[]> {
  const cacheKey = `trends:google:${geo}:${keywords.sort().join(',')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    // google-trends-api is optional — graceful fallback
    const googleTrends = await import('google-trends-api').catch(() => null);
    if (!googleTrends) {
      logger.warn('google-trends-api not installed, returning empty Google Trends');
      return [];
    }

    const results = await googleTrends.default.interestOverTime({
      keyword: keywords.slice(0, 5),
      geo,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    const parsed = JSON.parse(results);
    const trends = parsed.default?.timelineData?.map((d: any) => ({
      time: d.formattedTime,
      values: d.value,
      keywords: keywords.slice(0, 5),
    })) ?? [];

    await redis.set(cacheKey, JSON.stringify(trends), 'EX', CACHE_TTL);
    return trends;
  } catch (err) {
    logger.error('Google Trends fetch failed', err);
    return [];
  }
}

// ─── YouTube Trending ────────────────────────────────────────

export async function getYouTubeTrending(regionCode: string = 'IN', categoryId: string = '0'): Promise<unknown[]> {
  const cacheKey = `trends:youtube:${regionCode}:${categoryId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      logger.warn('YOUTUBE_API_KEY not set, skipping YouTube trending');
      return [];
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('chart', 'mostPopular');
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('videoCategoryId', categoryId);
    url.searchParams.set('maxResults', '20');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      logger.error(`YouTube trending API error: ${res.status}`);
      return [];
    }

    const data = await res.json() as any;
    const trends = (data.items ?? []).map((item: any) => ({
      videoId: item.id,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      tags: item.snippet?.tags?.slice(0, 10) ?? [],
      viewCount: Number(item.statistics?.viewCount ?? 0),
      likeCount: Number(item.statistics?.likeCount ?? 0),
      publishedAt: item.snippet?.publishedAt,
    }));

    await redis.set(cacheKey, JSON.stringify(trends), 'EX', CACHE_TTL);
    return trends;
  } catch (err) {
    logger.error('YouTube trending fetch failed', err);
    return [];
  }
}

// ─── TikTok Trending Hashtags ────────────────────────────────

export async function getTikTokTrending(): Promise<unknown[]> {
  const cacheKey = 'trends:tiktok:hashtags';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    // TikTok Creative Center doesn't have a public API;
    // use Research API if available, otherwise return empty
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('TIKTOK_ACCESS_TOKEN not set, skipping TikTok trending');
      return [];
    }

    const res = await fetch('https://open.tiktokapis.com/v2/research/hashtag/trending/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count: 20 }),
    });

    if (!res.ok) {
      logger.error(`TikTok trending API error: ${res.status}`);
      return [];
    }

    const data = await res.json() as any;
    const trends = (data.data?.hashtags ?? []).map((h: any) => ({
      hashtag: h.hashtag_name,
      videoCount: h.video_count,
      viewCount: h.view_count,
    }));

    await redis.set(cacheKey, JSON.stringify(trends), 'EX', CACHE_TTL);
    return trends;
  } catch (err) {
    logger.error('TikTok trending fetch failed', err);
    return [];
  }
}

// ─── Instagram Trending (hashtag volume) ─────────────────────

export async function getInstagramHashtagVolume(hashtags: string[]): Promise<unknown[]> {
  const cacheKey = `trends:ig:${hashtags.sort().join(',')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('INSTAGRAM_ACCESS_TOKEN not set, skipping IG hashtag volume');
      return [];
    }

    const results = await Promise.all(
      hashtags.slice(0, 5).map(async (tag) => {
        const searchUrl = new URL('https://graph.facebook.com/v21.0/ig_hashtag_search');
        searchUrl.searchParams.set('q', tag);
        searchUrl.searchParams.set('user_id', process.env.INSTAGRAM_USER_ID ?? '');
        searchUrl.searchParams.set('access_token', accessToken);

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) return { hashtag: tag, mediaCount: 0 };
        const searchData = await searchRes.json() as any;
        const hashtagId = searchData.data?.[0]?.id;
        if (!hashtagId) return { hashtag: tag, mediaCount: 0 };

        const infoUrl = new URL(`https://graph.facebook.com/v21.0/${hashtagId}`);
        infoUrl.searchParams.set('fields', 'name,media_count');
        infoUrl.searchParams.set('access_token', accessToken);

        const infoRes = await fetch(infoUrl.toString());
        if (!infoRes.ok) return { hashtag: tag, mediaCount: 0 };
        const infoData = await infoRes.json() as any;
        return { hashtag: tag, mediaCount: infoData.media_count ?? 0 };
      }),
    );

    await redis.set(cacheKey, JSON.stringify(results), 'EX', CACHE_TTL);
    return results;
  } catch (err) {
    logger.error('Instagram hashtag volume fetch failed', err);
    return [];
  }
}

// ─── Aggregated Trend Data ───────────────────────────────────

export async function getAllTrendData(niche: string[], region: string = 'IN') {
  const [google, youtube, tiktok, instagram] = await Promise.all([
    getGoogleTrends(niche, region),
    getYouTubeTrending(region),
    getTikTokTrending(),
    getInstagramHashtagVolume(niche),
  ]);

  return { google, youtube, tiktok, instagram };
}
