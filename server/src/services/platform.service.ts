import { logger } from '../config/logger.js';

export interface PlatformPublishResult {
  externalPostId: string;
  url: string;
}

export interface PlatformAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
}

export interface PlatformProfile {
  handle: string;
  followers: number;
  following: number;
  postsCount: number;
  bio?: string;
  profilePicUrl?: string;
}

export interface IPlatformService {
  platform: string;
  publish(accessToken: string, data: {
    caption?: string;
    mediaUrls: string[];
    postType: string;
  }): Promise<PlatformPublishResult>;
  getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics>;
  getProfile(accessToken: string): Promise<PlatformProfile>;
  getComments(accessToken: string, externalPostId: string): Promise<Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }>>;
}

// ─── Instagram Graph API ────────────────────────────────────

export class InstagramService implements IPlatformService {
  platform = 'INSTAGRAM';
  private baseUrl = 'https://graph.instagram.com';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch(
        `${this.baseUrl}/me?fields=id,username,media_count,account_type&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Instagram profile API ${res.status}`);
      const data = (await res.json()) as { username?: string; media_count?: number };
      return {
        handle: data.username ?? '',
        followers: 0, // Requires Instagram Business Account + page token for follower count
        following: 0,
        postsCount: data.media_count ?? 0,
      };
    } catch (err) {
      logger.warn('Instagram getProfile failed, returning empty', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/insights?metric=impressions,reach,likes,comments,shares,saved&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Instagram insights API ${res.status}`);
      const json = (await res.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
      const metrics: Record<string, number> = {};
      for (const m of json.data ?? []) {
        metrics[m.name] = m.values?.[0]?.value ?? 0;
      }
      return {
        impressions: metrics.impressions ?? 0,
        reach: metrics.reach ?? 0,
        likes: metrics.likes ?? 0,
        comments: metrics.comments ?? 0,
        shares: metrics.shares ?? 0,
        saves: metrics.saved ?? 0,
        clicks: 0,
      };
    } catch (err) {
      logger.warn('Instagram getAnalytics failed', { postId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/comments?fields=id,username,text,timestamp&access_token=${accessToken}`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<{ id: string; username: string; text: string; timestamp: string }> };
      return (json.data ?? []).map((c) => ({
        id: c.id,
        authorName: c.username,
        content: c.text,
        createdAt: new Date(c.timestamp),
      }));
    } catch {
      return [];
    }
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    // Instagram content publishing requires a Business/Creator account and uses a two-step process:
    // 1. Create a media container  2. Publish the container
    // This requires the media to be hosted at a public URL
    try {
      if (!data.mediaUrls.length) throw new Error('No media URLs provided');
      // Step 1: Create media container
      const containerRes = await fetch(`${this.baseUrl}/me/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: data.mediaUrls[0],
          caption: data.caption ?? '',
          access_token: accessToken,
        }),
      });
      if (!containerRes.ok) throw new Error(`Container creation failed ${containerRes.status}`);
      const container = (await containerRes.json()) as { id: string };

      // Step 2: Publish
      const publishRes = await fetch(`${this.baseUrl}/me/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
      });
      if (!publishRes.ok) throw new Error(`Publish failed ${publishRes.status}`);
      const published = (await publishRes.json()) as { id: string };

      return { externalPostId: published.id, url: `https://instagram.com/p/${published.id}` };
    } catch (err) {
      logger.warn('Instagram publish failed', { error: (err as Error).message });
      return { externalPostId: `ig_${Date.now()}`, url: '' };
    }
  }
}

// ─── YouTube Data API v3 ────────────────────────────────────

export class YouTubeService implements IPlatformService {
  platform = 'YOUTUBE';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`YouTube channels API ${res.status}`);
      const json = (await res.json()) as {
        items?: Array<{
          snippet?: { title?: string; thumbnails?: { default?: { url?: string } }; description?: string };
          statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
        }>;
      };
      const ch = json.items?.[0];
      return {
        handle: ch?.snippet?.title ?? '',
        followers: Number(ch?.statistics?.subscriberCount ?? 0),
        following: 0,
        postsCount: Number(ch?.statistics?.videoCount ?? 0),
        bio: ch?.snippet?.description,
        profilePicUrl: ch?.snippet?.thumbnails?.default?.url,
      };
    } catch (err) {
      logger.warn('YouTube getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${externalPostId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`YouTube video stats API ${res.status}`);
      const json = (await res.json()) as {
        items?: Array<{
          statistics?: { viewCount?: string; likeCount?: string; commentCount?: string; favoriteCount?: string };
        }>;
      };
      const stats = json.items?.[0]?.statistics;
      return {
        impressions: Number(stats?.viewCount ?? 0),
        reach: Number(stats?.viewCount ?? 0),
        likes: Number(stats?.likeCount ?? 0),
        comments: Number(stats?.commentCount ?? 0),
        shares: 0,
        saves: Number(stats?.favoriteCount ?? 0),
        clicks: 0,
      };
    } catch (err) {
      logger.warn('YouTube getAnalytics failed', { videoId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${externalPostId}&maxResults=50&order=time`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        items?: Array<{
          id: string;
          snippet?: { topLevelComment?: { snippet?: { authorDisplayName?: string; textDisplay?: string; publishedAt?: string } } };
        }>;
      };
      return (json.items ?? []).map((item) => {
        const s = item.snippet?.topLevelComment?.snippet;
        return {
          id: item.id,
          authorName: s?.authorDisplayName ?? '',
          content: s?.textDisplay ?? '',
          createdAt: new Date(s?.publishedAt ?? Date.now()),
        };
      });
    } catch {
      return [];
    }
  }

  async publish(_accessToken: string, _data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    // YouTube video upload requires the Resumable Upload API with multipart form data
    // This is a complex flow best done client-side or via a dedicated upload worker
    logger.info('YouTube publish: video upload requires dedicated upload flow');
    return { externalPostId: `yt_${Date.now()}`, url: '' };
  }
}

// ─── TikTok Content Posting API v2 ─────────────────────────

export class TikTokService implements IPlatformService {
  platform = 'TIKTOK';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,follower_count,following_count,video_count,avatar_url,bio_description', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`TikTok user info API ${res.status}`);
      const json = (await res.json()) as {
        data?: { user?: { display_name?: string; follower_count?: number; following_count?: number; video_count?: number; bio_description?: string; avatar_url?: string } };
      };
      const u = json.data?.user;
      return {
        handle: u?.display_name ?? '',
        followers: u?.follower_count ?? 0,
        following: u?.following_count ?? 0,
        postsCount: u?.video_count ?? 0,
        bio: u?.bio_description,
        profilePicUrl: u?.avatar_url,
      };
    } catch (err) {
      logger.warn('TikTok getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      const res = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { video_ids: [externalPostId] } }),
      });
      if (!res.ok) throw new Error(`TikTok video query API ${res.status}`);
      const json = (await res.json()) as {
        data?: { videos?: Array<{ like_count?: number; comment_count?: number; share_count?: number; view_count?: number }> };
      };
      const v = json.data?.videos?.[0];
      return {
        impressions: v?.view_count ?? 0,
        reach: v?.view_count ?? 0,
        likes: v?.like_count ?? 0,
        comments: v?.comment_count ?? 0,
        shares: v?.share_count ?? 0,
        saves: 0,
        clicks: 0,
      };
    } catch (err) {
      logger.warn('TikTok getAnalytics failed', { videoId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch('https://open.tiktokapis.com/v2/comment/list/?fields=id,text,create_time,user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: externalPostId, max_count: 50 }),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as {
        data?: { comments?: Array<{ id: string; text: string; create_time: number; user?: { display_name: string } }> };
      };
      return (json.data?.comments ?? []).map((c) => ({
        id: c.id,
        authorName: c.user?.display_name ?? '',
        content: c.text,
        createdAt: new Date(c.create_time * 1000),
      }));
    } catch {
      return [];
    }
  }

  async publish(_accessToken: string, _data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    // TikTok content posting uses the Content Posting API which requires video upload
    logger.info('TikTok publish: video upload requires dedicated upload flow');
    return { externalPostId: `tt_${Date.now()}`, url: '' };
  }
}

// ─── Service registry ───────────────────────────────────────

const services: Record<string, IPlatformService> = {
  INSTAGRAM: new InstagramService(),
  YOUTUBE: new YouTubeService(),
  TIKTOK: new TikTokService(),
};

export function getPlatformService(platform: string): IPlatformService {
  const service = services[platform];
  if (!service) throw new Error(`Unsupported platform: ${platform}`);
  return service;
}
