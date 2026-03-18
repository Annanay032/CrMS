export type Period = 'week' | 'month' | 'quarter';

export interface MetricItem {
  name: string;
  value: number;
}

export interface PlatformBreakdown {
  platform: string;
  followers: number;
  engagementRate: number;
}
