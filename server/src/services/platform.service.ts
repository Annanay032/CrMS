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

export class InstagramService implements IPlatformService {
  platform = 'INSTAGRAM';

  async publish(_accessToken: string, _data: { caption?: string; mediaUrls: string[]; postType: string }) {
    return { externalPostId: `ig_${Date.now()}`, url: `https://instagram.com/p/placeholder` };
  }

  async getAnalytics(_accessToken: string, _externalPostId: string) {
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(_accessToken: string) {
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(_accessToken: string, _externalPostId: string) {
    return [];
  }
}

export class YouTubeService implements IPlatformService {
  platform = 'YOUTUBE';

  async publish(_accessToken: string, _data: { caption?: string; mediaUrls: string[]; postType: string }) {
    return { externalPostId: `yt_${Date.now()}`, url: `https://youtube.com/watch?v=placeholder` };
  }

  async getAnalytics(_accessToken: string, _externalPostId: string) {
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(_accessToken: string) {
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(_accessToken: string, _externalPostId: string) {
    return [];
  }
}

export class TikTokService implements IPlatformService {
  platform = 'TIKTOK';

  async publish(_accessToken: string, _data: { caption?: string; mediaUrls: string[]; postType: string }) {
    return { externalPostId: `tt_${Date.now()}`, url: `https://tiktok.com/@placeholder/video/placeholder` };
  }

  async getAnalytics(_accessToken: string, _externalPostId: string) {
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  }

  async getProfile(_accessToken: string) {
    return { handle: '', followers: 0, following: 0, postsCount: 0 };
  }

  async getComments(_accessToken: string, _externalPostId: string) {
    return [];
  }
}

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
