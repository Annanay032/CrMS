export interface Creator {
  id: string;
  niche: string[];
  location?: string;
  user: { name: string; avatarUrl?: string };
  platformStats: Array<{
    platform: string;
    followers: number;
    engagementRate: number;
  }>;
}
