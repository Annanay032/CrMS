export type Period = 'week' | 'month' | 'quarter' | 'year';

export interface MetricItem {
  name: string;
  value: number;
}

export interface PlatformBreakdown {
  platform: string;
  followers: number;
  engagementRate: number;
}

export interface ContentTypeBreakdown {
  type: string;
  count: number;
  totalEngagement: number;
  totalReach: number;
  avgEngRate: number;
}

export type AnalyticsTab = 'overview' | 'content' | 'audience' | 'reports' | 'post';
