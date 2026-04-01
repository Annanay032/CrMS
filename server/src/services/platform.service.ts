import { logger } from '../config/logger.js';
import { createReadStream, statSync } from 'fs';
import { downloadToLocal } from './storage.service.js';
// path import removed (unused)

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
  videoViews?: number;
  avgWatchTime?: number;
  estimatedRevenue?: number;
  isPaid?: boolean;
  adSpend?: number;
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
    scheduledAt?: Date;
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
      // Fetch basic insights: impressions, reach, likes, comments, shares, saved
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/insights?metric=impressions,reach,likes,comments,shares,saved,total_interactions&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Instagram insights API ${res.status}`);
      const json = (await res.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
      const metrics: Record<string, number> = {};
      for (const m of json.data ?? []) {
        metrics[m.name] = m.values?.[0]?.value ?? 0;
      }

      // Try to fetch video/reel-specific metrics (plays, ig_reels_video_view_total_time)
      let videoViews = 0;
      let avgWatchTime = 0;
      try {
        const videoRes = await fetch(
          `${this.baseUrl}/${externalPostId}/insights?metric=plays,ig_reels_avg_watch_time&access_token=${accessToken}`,
        );
        if (videoRes.ok) {
          const videoJson = (await videoRes.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
          for (const m of videoJson.data ?? []) {
            if (m.name === 'plays') videoViews = m.values?.[0]?.value ?? 0;
            if (m.name === 'ig_reels_avg_watch_time') avgWatchTime = (m.values?.[0]?.value ?? 0) / 1000; // ms → seconds
          }
        }
      } catch {
        // Video metrics not available for non-video posts — ignore
      }

      return {
        impressions: metrics.impressions ?? 0,
        reach: metrics.reach ?? 0,
        likes: metrics.likes ?? 0,
        comments: metrics.comments ?? 0,
        shares: metrics.shares ?? 0,
        saves: metrics.saved ?? 0,
        clicks: metrics.total_interactions ?? 0,
        videoViews,
        avgWatchTime,
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

  async getRecentMedia(accessToken: string, limit = 25) {
    try {
      const res = await fetch(
        `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=${limit}&access_token=${accessToken}`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<{ id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; timestamp: string; permalink: string }> };
      return json.data ?? [];
    } catch {
      return [];
    }
  }

  async getDMConversations(accessToken: string, igUserId: string) {
    try {
      // Instagram Messaging API (requires approved app with instagram_manage_messages scope)
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/conversations?platform=instagram&fields=id,participants,messages{id,message,from,created_time}&access_token=${accessToken}`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: unknown[] };
      return json.data ?? [];
    } catch {
      return [];
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
      // 1. YouTube Data API — video statistics
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(externalPostId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        const errBody = await res.text();
        logger.warn('YouTube video stats API failed', { videoId: externalPostId, status: res.status, body: errBody });
        throw new Error(`YouTube video stats API ${res.status}`);
      }
      const json = (await res.json()) as {
        items?: Array<{
          statistics?: { viewCount?: string; likeCount?: string; commentCount?: string; favoriteCount?: string };
        }>;
      };
      const stats = json.items?.[0]?.statistics;

      const viewCount = Number(stats?.viewCount ?? 0);
      const likeCount = Number(stats?.likeCount ?? 0);
      const commentCount = Number(stats?.commentCount ?? 0);

      // 2. YouTube Analytics API — shares, watch time, revenue
      let shares = 0;
      let avgWatchTime = 0;
      let estimatedRevenue = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        const analyticsRes = await fetch(
          `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2020-01-01&endDate=${today}&metrics=shares,averageViewDuration,estimatedMinutesWatched,estimatedRevenue&filters=video==${encodeURIComponent(externalPostId)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (analyticsRes.ok) {
          const analyticsJson = (await analyticsRes.json()) as { rows?: Array<number[]> };
          if (analyticsJson.rows?.[0]) {
            const row = analyticsJson.rows[0];
            shares = row[0] ?? 0;
            avgWatchTime = row[1] ?? 0; // averageViewDuration in seconds
            // row[2] = estimatedMinutesWatched (skipped, we use avgWatchTime)
            estimatedRevenue = row[3] ?? 0;
          }
        }
      } catch (analyticsErr) {
        logger.debug('YouTube Analytics API unavailable, using Data API only', { videoId: externalPostId, error: (analyticsErr as Error).message });
      }

      return {
        impressions: viewCount,
        reach: viewCount,
        likes: likeCount,
        comments: commentCount,
        shares,
        saves: 0, // favoriteCount is deprecated (always 0)
        clicks: 0,
        videoViews: viewCount,
        avgWatchTime,
        estimatedRevenue,
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

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string; scheduledAt?: Date }): Promise<PlatformPublishResult> {
    // YouTube Data API v3 — resumable video upload
    if (!data.mediaUrls.length) throw new Error('No media/video URL provided');

    // Find the video file from mediaUrls (skip images)
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'];
    const mediaUrl = data.mediaUrls.find((url) => videoExtensions.some((ext) => url.toLowerCase().endsWith(ext)))
      ?? data.mediaUrls[0]; // Fallback to first if no video extension found

    logger.info(`YouTube publish: using media URL "${mediaUrl}" from ${data.mediaUrls.length} URLs`, {
      allUrls: data.mediaUrls,
      postType: data.postType,
    });

    // Download to local path (handles both local disk and cloud storage)
    let localPath: string;
    try {
      localPath = await downloadToLocal(mediaUrl);
    } catch (err) {
      logger.error(`YouTube upload: failed to resolve video file`, { mediaUrl, error: (err as Error).message });
      throw new Error(`Video file not found: ${mediaUrl}. YouTube upload requires an accessible file.`);
    }

    const fileStat = statSync(localPath);
    const fileSize = fileStat.size;
    const isShort = data.postType === 'SHORT';
    const title = data.caption?.slice(0, 100) || (isShort ? 'Short' : 'Video');
    const description = data.caption || '';

    // Determine if this is a scheduled upload (future date)
    const isScheduled = data.scheduledAt && new Date(data.scheduledAt).getTime() > Date.now() + 60_000;

    // Step 1: Initiate resumable upload
    const metadata = {
      snippet: {
        title,
        description,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: isScheduled ? 'private' : 'public',
        selfDeclaredMadeForKids: false,
        ...(isScheduled ? { publishAt: new Date(data.scheduledAt!).toISOString() } : {}),
      },
    };

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(fileSize),
          'X-Upload-Content-Type': 'video/*',
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!initRes.ok) {
      const errBody = await initRes.text();
      // Parse YouTube-specific error reasons for cleaner messages
      try {
        const errJson = JSON.parse(errBody) as { error?: { errors?: Array<{ reason?: string; message?: string }> } };
        const reason = errJson.error?.errors?.[0]?.reason;
        if (reason === 'uploadLimitExceeded') {
          throw new Error('uploadLimitExceeded: YouTube daily upload limit reached. The limit resets at midnight Pacific Time. Try again tomorrow.');
        }
        if (reason === 'quotaExceeded') {
          throw new Error('quotaExceeded: YouTube API quota exhausted for today. Try again tomorrow.');
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && (parseErr.message.includes('uploadLimitExceeded') || parseErr.message.includes('quotaExceeded'))) {
          throw parseErr;
        }
      }
      throw new Error(`YouTube upload init failed (${initRes.status}): ${errBody}`);
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) throw new Error('YouTube upload: no resumable upload URL returned');

    // Step 2: Upload the video file
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(localPath);
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': String(fileSize),
        'Content-Type': 'video/*',
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`YouTube video upload failed (${uploadRes.status}): ${errBody}`);
    }

    const result = (await uploadRes.json()) as { id?: string };
    const videoId = result.id ?? `yt_${Date.now()}`;

    logger.info(`YouTube video uploaded: ${videoId}`, { isShort, title, isScheduled: !!isScheduled });

    return {
      externalPostId: videoId,
      url: isShort
        ? `https://youtube.com/shorts/${videoId}`
        : `https://youtube.com/watch?v=${videoId}`,
    };
  }

  async getTrendingVideos(accessToken: string, regionCode = 'IN', maxResults = 20) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { items?: Array<{ id: string; snippet?: Record<string, unknown>; statistics?: Record<string, unknown> }> };
      return json.items ?? [];
    } catch {
      return [];
    }
  }

  async getChannelRevenue(accessToken: string, startDate: string, endDate: string) {
    try {
      // YouTube Analytics API — requires youtube.readonly + yt-analytics.readonly scopes
      const res = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=estimatedRevenue,estimatedAdRevenue,grossRevenue&dimensions=day`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return { rows: [], columnHeaders: [] };
      return (await res.json()) as { rows: unknown[]; columnHeaders: unknown[] };
    } catch {
      return { rows: [], columnHeaders: [] };
    }
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
      const res = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count,favorites_count,video_duration', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { video_ids: [externalPostId] } }),
      });
      if (!res.ok) throw new Error(`TikTok video query API ${res.status}`);
      const json = (await res.json()) as {
        data?: { videos?: Array<{ like_count?: number; comment_count?: number; share_count?: number; view_count?: number; favorites_count?: number; video_duration?: number }> };
      };
      const v = json.data?.videos?.[0];
      return {
        impressions: v?.view_count ?? 0,
        reach: v?.view_count ?? 0,
        likes: v?.like_count ?? 0,
        comments: v?.comment_count ?? 0,
        shares: v?.share_count ?? 0,
        saves: v?.favorites_count ?? 0,
        clicks: 0,
        videoViews: v?.view_count ?? 0,
        avgWatchTime: v?.video_duration ?? 0,
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

  async getTrendingHashtags(accessToken: string, count = 20) {
    try {
      const res = await fetch('https://open.tiktokapis.com/v2/research/hashtag/trending/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: { hashtags?: Array<{ hashtag_name: string; video_count: number; view_count: number }> } };
      return json.data?.hashtags ?? [];
    } catch {
      return [];
    }
  }
}

// ─── Twitter/X API v2 ───────────────────────────────────────

export class TwitterService implements IPlatformService {
  platform = 'TWITTER';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=public_metrics,description,profile_image_url,username',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`Twitter user API ${res.status}`);
      const json = (await res.json()) as {
        data?: { username?: string; public_metrics?: { followers_count?: number; following_count?: number; tweet_count?: number }; description?: string; profile_image_url?: string };
      };
      const u = json.data;
      return {
        handle: u?.username ?? '',
        followers: u?.public_metrics?.followers_count ?? 0,
        following: u?.public_metrics?.following_count ?? 0,
        postsCount: u?.public_metrics?.tweet_count ?? 0,
        bio: u?.description,
        profilePicUrl: u?.profile_image_url,
      };
    } catch (err) {
      logger.warn('Twitter getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/${encodeURIComponent(externalPostId)}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`Twitter tweet metrics API ${res.status}`);
      const json = (await res.json()) as {
        data?: {
          public_metrics?: { retweet_count?: number; reply_count?: number; like_count?: number; quote_count?: number; impression_count?: number; bookmark_count?: number };
          non_public_metrics?: { impression_count?: number; url_link_clicks?: number; user_profile_clicks?: number };
          organic_metrics?: { impression_count?: number; url_link_clicks?: number; user_profile_clicks?: number; retweet_count?: number; reply_count?: number; like_count?: number };
        };
      };
      const pub = json.data?.public_metrics;
      const nonPub = json.data?.non_public_metrics;
      return {
        impressions: pub?.impression_count ?? nonPub?.impression_count ?? 0,
        reach: pub?.impression_count ?? 0,
        likes: pub?.like_count ?? 0,
        comments: pub?.reply_count ?? 0,
        shares: (pub?.retweet_count ?? 0) + (pub?.quote_count ?? 0),
        saves: pub?.bookmark_count ?? 0,
        clicks: nonPub?.url_link_clicks ?? 0,
      };
    } catch (err) {
      logger.warn('Twitter getAnalytics failed', { tweetId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${encodeURIComponent(externalPostId)}&tweet.fields=author_id,created_at,text&max_results=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<{ id: string; author_id?: string; text: string; created_at?: string }> };
      return (json.data ?? []).map((t) => ({
        id: t.id,
        authorName: t.author_id ?? '',
        content: t.text,
        createdAt: new Date(t.created_at ?? Date.now()),
      }));
    } catch {
      return [];
    }
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    try {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.caption ?? '' }),
      });
      if (!res.ok) throw new Error(`Twitter post API ${res.status}`);
      const json = (await res.json()) as { data?: { id: string } };
      const tweetId = json.data?.id ?? '';
      return { externalPostId: tweetId, url: `https://x.com/i/status/${tweetId}` };
    } catch (err) {
      logger.warn('Twitter publish failed', { error: (err as Error).message });
      return { externalPostId: `tw_${Date.now()}`, url: '' };
    }
  }
}

// ─── LinkedIn API v2 ────────────────────────────────────────

export class LinkedInService implements IPlatformService {
  platform = 'LINKEDIN';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`LinkedIn profile API ${res.status}`);
      const json = (await res.json()) as { name?: string; sub?: string; picture?: string };
      return {
        handle: json.name ?? '',
        followers: 0,
        following: 0,
        postsCount: 0,
        profilePicUrl: json.picture,
      };
    } catch (err) {
      logger.warn('LinkedIn getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      // LinkedIn socialActions endpoint for likes, comments, shares
      const res = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(externalPostId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`LinkedIn socialActions API ${res.status}`);
      const json = (await res.json()) as {
        likesSummary?: { totalLikes?: number };
        commentsSummary?: { totalFirstLevelComments?: number };
        shareStatistics?: { shareCount?: number };
      };

      // Try organizationalEntityShareStatistics for impressions/clicks
      let impressions = 0;
      let clicks = 0;
      try {
        const statsRes = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&shares[0]=${encodeURIComponent(externalPostId)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (statsRes.ok) {
          const statsJson = (await statsRes.json()) as {
            elements?: Array<{
              totalShareStatistics?: { impressionCount?: number; clickCount?: number; shareCount?: number; engagement?: number };
            }>;
          };
          const stats = statsJson.elements?.[0]?.totalShareStatistics;
          impressions = stats?.impressionCount ?? 0;
          clicks = stats?.clickCount ?? 0;
        }
      } catch {
        // Stats endpoint requires organization-level access — ignore
      }

      return {
        impressions,
        reach: impressions,
        likes: json.likesSummary?.totalLikes ?? 0,
        comments: json.commentsSummary?.totalFirstLevelComments ?? 0,
        shares: json.shareStatistics?.shareCount ?? 0,
        saves: 0,
        clicks,
      };
    } catch (err) {
      logger.warn('LinkedIn getAnalytics failed', { postId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(externalPostId)}/comments?count=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        elements?: Array<{ $URN?: string; actor?: string; message?: { text?: string }; created?: { time?: number } }>;
      };
      return (json.elements ?? []).map((c) => ({
        id: c.$URN ?? '',
        authorName: c.actor ?? '',
        content: c.message?.text ?? '',
        createdAt: new Date(c.created?.time ?? Date.now()),
      }));
    } catch {
      return [];
    }
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    try {
      // Get author URN
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) throw new Error(`LinkedIn userinfo ${meRes.status}`);
      const me = (await meRes.json()) as { sub?: string };
      const authorUrn = `urn:li:person:${me.sub}`;

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: data.caption ?? '' },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });
      if (!res.ok) throw new Error(`LinkedIn ugcPosts API ${res.status}`);
      const json = (await res.json()) as { id?: string };
      const postId = json.id ?? '';
      return { externalPostId: postId, url: `https://www.linkedin.com/feed/update/${postId}` };
    } catch (err) {
      logger.warn('LinkedIn publish failed', { error: (err as Error).message });
      return { externalPostId: `li_${Date.now()}`, url: '' };
    }
  }
}

// ─── Facebook Graph API ─────────────────────────────────────

export class FacebookService implements IPlatformService {
  platform = 'FACEBOOK';
  private baseUrl = 'https://graph.facebook.com/v21.0';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      // Get page info (using page token)
      const res = await fetch(
        `${this.baseUrl}/me?fields=name,fan_count,followers_count,about,picture.type(large)&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Facebook page API ${res.status}`);
      const json = (await res.json()) as {
        name?: string; fan_count?: number; followers_count?: number; about?: string;
        picture?: { data?: { url?: string } };
      };
      return {
        handle: json.name ?? '',
        followers: json.followers_count ?? json.fan_count ?? 0,
        following: 0,
        postsCount: 0,
        bio: json.about,
        profilePicUrl: json.picture?.data?.url,
      };
    } catch (err) {
      logger.warn('Facebook getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      // Fetch post-level insights (requires pages_read_engagement permission)
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/insights?metric=post_impressions,post_impressions_unique,post_clicks,post_reactions_like_total&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Facebook post insights API ${res.status}`);
      const json = (await res.json()) as { data?: Array<{ name: string; values: Array<{ value: number | Record<string, number> }> }> };
      const metrics: Record<string, number> = {};
      for (const m of json.data ?? []) {
        const val = m.values?.[0]?.value;
        metrics[m.name] = typeof val === 'number' ? val : 0;
      }

      // Fetch basic post fields for comments, shares
      let likeCount = metrics.post_reactions_like_total ?? 0;
      let commentCount = 0;
      let shareCount = 0;
      let videoViews = 0;
      try {
        const postRes = await fetch(
          `${this.baseUrl}/${externalPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`,
        );
        if (postRes.ok) {
          const postJson = (await postRes.json()) as {
            likes?: { summary?: { total_count?: number } };
            comments?: { summary?: { total_count?: number } };
            shares?: { count?: number };
          };
          likeCount = postJson.likes?.summary?.total_count ?? likeCount;
          commentCount = postJson.comments?.summary?.total_count ?? 0;
          shareCount = postJson.shares?.count ?? 0;
        }
      } catch {
        // Ignore — use insights data
      }

      // Try video views for video posts
      try {
        const videoRes = await fetch(
          `${this.baseUrl}/${externalPostId}/insights?metric=post_video_views&access_token=${accessToken}`,
        );
        if (videoRes.ok) {
          const videoJson = (await videoRes.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
          for (const m of videoJson.data ?? []) {
            if (m.name === 'post_video_views') videoViews = m.values?.[0]?.value ?? 0;
          }
        }
      } catch {
        // Not a video post — ignore
      }

      return {
        impressions: metrics.post_impressions ?? 0,
        reach: metrics.post_impressions_unique ?? 0,
        likes: likeCount,
        comments: commentCount,
        shares: shareCount,
        saves: 0,
        clicks: metrics.post_clicks ?? 0,
        videoViews,
      };
    } catch (err) {
      logger.warn('Facebook getAnalytics failed', { postId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/comments?fields=id,from,message,created_time&limit=50&access_token=${accessToken}`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<{ id: string; from?: { name?: string }; message: string; created_time: string }> };
      return (json.data ?? []).map((c) => ({
        id: c.id,
        authorName: c.from?.name ?? '',
        content: c.message,
        createdAt: new Date(c.created_time),
      }));
    } catch {
      return [];
    }
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    try {
      const res = await fetch(`${this.baseUrl}/me/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: data.caption ?? '',
          access_token: accessToken,
        }),
      });
      if (!res.ok) throw new Error(`Facebook post API ${res.status}`);
      const json = (await res.json()) as { id?: string };
      const postId = json.id ?? '';
      return { externalPostId: postId, url: `https://facebook.com/${postId}` };
    } catch (err) {
      logger.warn('Facebook publish failed', { error: (err as Error).message });
      return { externalPostId: `fb_${Date.now()}`, url: '' };
    }
  }
}

// ─── Threads API (Meta) ─────────────────────────────────────

export class ThreadsService implements IPlatformService {
  platform = 'THREADS';
  private baseUrl = 'https://graph.threads.net/v1.0';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch(
        `${this.baseUrl}/me?fields=id,username,threads_biography,threads_profile_picture_url&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Threads profile API ${res.status}`);
      const json = (await res.json()) as { username?: string; threads_biography?: string; threads_profile_picture_url?: string };
      return {
        handle: json.username ?? '',
        followers: 0,
        following: 0,
        postsCount: 0,
        bio: json.threads_biography,
        profilePicUrl: json.threads_profile_picture_url,
      };
    } catch (err) {
      logger.warn('Threads getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      // Threads Media Insights API
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${accessToken}`,
      );
      if (!res.ok) throw new Error(`Threads insights API ${res.status}`);
      const json = (await res.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
      const metrics: Record<string, number> = {};
      for (const m of json.data ?? []) {
        metrics[m.name] = m.values?.[0]?.value ?? 0;
      }
      return {
        impressions: metrics.views ?? 0,
        reach: metrics.views ?? 0,
        likes: metrics.likes ?? 0,
        comments: metrics.replies ?? 0,
        shares: (metrics.reposts ?? 0) + (metrics.quotes ?? 0),
        saves: 0,
        clicks: 0,
      };
    } catch (err) {
      logger.warn('Threads getAnalytics failed', { postId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(accessToken: string, externalPostId: string) {
    try {
      const res = await fetch(
        `${this.baseUrl}/${externalPostId}/replies?fields=id,text,username,timestamp&access_token=${accessToken}`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<{ id: string; username?: string; text?: string; timestamp?: string }> };
      return (json.data ?? []).map((c) => ({
        id: c.id,
        authorName: c.username ?? '',
        content: c.text ?? '',
        createdAt: new Date(c.timestamp ?? Date.now()),
      }));
    } catch {
      return [];
    }
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    try {
      // Step 1: Create container
      const containerRes = await fetch(`${this.baseUrl}/me/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: data.caption ?? '',
          access_token: accessToken,
        }),
      });
      if (!containerRes.ok) throw new Error(`Threads container creation ${containerRes.status}`);
      const container = (await containerRes.json()) as { id: string };

      // Step 2: Publish
      const publishRes = await fetch(`${this.baseUrl}/me/threads_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
      });
      if (!publishRes.ok) throw new Error(`Threads publish ${publishRes.status}`);
      const published = (await publishRes.json()) as { id: string };
      return { externalPostId: published.id, url: `https://threads.net/post/${published.id}` };
    } catch (err) {
      logger.warn('Threads publish failed', { error: (err as Error).message });
      return { externalPostId: `th_${Date.now()}`, url: '' };
    }
  }
}

// ─── Pinterest API v5 ───────────────────────────────────────

export class PinterestService implements IPlatformService {
  platform = 'PINTEREST';
  private baseUrl = 'https://api.pinterest.com/v5';

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const res = await fetch(`${this.baseUrl}/user_account`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Pinterest user API ${res.status}`);
      const json = (await res.json()) as { username?: string; follower_count?: number; following_count?: number; pin_count?: number; profile_image?: string; about?: string };
      return {
        handle: json.username ?? '',
        followers: json.follower_count ?? 0,
        following: json.following_count ?? 0,
        postsCount: json.pin_count ?? 0,
        bio: json.about,
        profilePicUrl: json.profile_image,
      };
    } catch (err) {
      logger.warn('Pinterest getProfile failed', { error: (err as Error).message });
      return { handle: '', followers: 0, following: 0, postsCount: 0 };
    }
  }

  async getAnalytics(accessToken: string, externalPostId: string): Promise<PlatformAnalytics> {
    try {
      // Pin analytics endpoint
      const res = await fetch(
        `${this.baseUrl}/pins/${encodeURIComponent(externalPostId)}/analytics?start_date=2020-01-01&end_date=2030-12-31&metric_types=IMPRESSION,PIN_CLICK,OUTBOUND_CLICK,SAVE,COMMENT`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`Pinterest pin analytics API ${res.status}`);
      const json = (await res.json()) as {
        all?: { lifetime_metrics?: { IMPRESSION?: number; PIN_CLICK?: number; OUTBOUND_CLICK?: number; SAVE?: number; COMMENT?: number } };
      };
      const m = json.all?.lifetime_metrics;
      return {
        impressions: m?.IMPRESSION ?? 0,
        reach: m?.IMPRESSION ?? 0,
        likes: 0, // Pinterest doesn't have likes
        comments: m?.COMMENT ?? 0,
        shares: 0,
        saves: m?.SAVE ?? 0,
        clicks: (m?.PIN_CLICK ?? 0) + (m?.OUTBOUND_CLICK ?? 0),
      };
    } catch (err) {
      logger.warn('Pinterest getAnalytics failed', { pinId: externalPostId, error: (err as Error).message });
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
    }
  }

  async getComments(_accessToken: string, _externalPostId: string) {
    // Pinterest API v5 doesn't expose a comments list endpoint
    return [];
  }

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }): Promise<PlatformPublishResult> {
    try {
      const res = await fetch(`${this.baseUrl}/pins`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.caption?.slice(0, 100) ?? '',
          description: data.caption ?? '',
          ...(data.mediaUrls[0] ? { media_source: { source_type: 'image_url', url: data.mediaUrls[0] } } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Pinterest pin create API ${res.status}`);
      const json = (await res.json()) as { id?: string };
      const pinId = json.id ?? '';
      return { externalPostId: pinId, url: `https://pinterest.com/pin/${pinId}` };
    } catch (err) {
      logger.warn('Pinterest publish failed', { error: (err as Error).message });
      return { externalPostId: `pin_${Date.now()}`, url: '' };
    }
  }
}

// ─── Service registry ───────────────────────────────────────

const services: Record<string, IPlatformService> = {
  INSTAGRAM: new InstagramService(),
  YOUTUBE: new YouTubeService(),
  TIKTOK: new TikTokService(),
  TWITTER: new TwitterService(),
  LINKEDIN: new LinkedInService(),
  FACEBOOK: new FacebookService(),
  THREADS: new ThreadsService(),
  PINTEREST: new PinterestService(),
};

export function getPlatformService(platform: string): IPlatformService {
  const service = services[platform];
  if (!service) throw new Error(`Unsupported platform: ${platform}`);
  return service;
}
