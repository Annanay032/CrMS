import type { Platform } from '../types/enums.js';

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
}

export interface IPlatformService {
  platform: Platform;
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

// Placeholder implementations — each will call the real platform API
export class InstagramService implements IPlatformService {
  platform = 'INSTAGRAM' as const;

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }) {
    // TODO: Implement Instagram Graph API publish
    return { externalPostId: `ig_${Date.now()}`, url: `https://instagram.com/p/placeholder` };
  }

  async getAnalytics(accessToken: string, externalPostId: string) {
    // TODO: Implement Instagram Insights API
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(accessToken: string) {
    // TODO: Implement Instagram Graph API profile fetch
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(accessToken: string, externalPostId: string) {
    // TODO: Implement Instagram Comments API
    return [];
  }
}

export class YouTubeService implements IPlatformService {
  platform = 'YOUTUBE' as const;

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }) {
    // TODO: Implement YouTube Data API upload
    return { externalPostId: `yt_${Date.now()}`, url: `https://youtube.com/watch?v=placeholder` };
  }

  async getAnalytics(accessToken: string, externalPostId: string) {
    // TODO: Implement YouTube Analytics API
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(accessToken: string) {
    // TODO: Implement YouTube Channel API
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(accessToken: string, externalPostId: string) {
    // TODO: Implement YouTube Comments API
    return [];
  }
}

export class TikTokService implements IPlatformService {
  platform = 'TIKTOK' as const;

  async publish(accessToken: string, data: { caption?: string; mediaUrls: string[]; postType: string }) {
    // TODO: Implement TikTok Content Posting API
    return { externalPostId: `tt_${Date.now()}`, url: `https://tiktok.com/@placeholder/video/placeholder` };
  }

  async getAnalytics(accessToken: string, externalPostId: string) {
    // TODO: Implement TikTok Analytics API
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(accessToken: string) {
    // TODO: Implement TikTok User API
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(accessToken: string, externalPostId: string) {
    // TODO: Implement TikTok Comments API
    return [];
  }
}

const services: Record<string, IPlatformService> = {
  INSTAGRAM: new InstagramService(),
  YOUTUBE: new YouTubeService(),
  TIKTOK: new TikTokService(),
};

export function getPlatformService(platform: Platform): IPlatformService {
  const service = services[platform];
  if (!service) throw new Error(`Unsupported platform: ${platform}`);
  return service;
}
