import type { Period } from './types';

export const PERIODS: Period[] = ['week', 'month', 'quarter', 'year'];

export const REPORT_METRICS = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'followerGrowth', label: 'Follower Growth' },
  { value: 'audience', label: 'Audience Demographics' },
  { value: 'contentPerformance', label: 'Content Performance' },
];

export const CONTENT_TYPE_COLORS: Record<string, string> = {
  IMAGE: '#4f46e5',
  VIDEO: '#dc2626',
  REEL: '#ec4899',
  STORY: '#f59e0b',
  CAROUSEL: '#10b981',
  SHORT: '#06b6d4',
  THREAD: '#8b5cf6',
};

export const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: '#e4405f',
  YOUTUBE: '#ff0000',
  TIKTOK: '#000000',
  TWITTER: '#1da1f2',
  LINKEDIN: '#0077b5',
  THREADS: '#000000',
  BLUESKY: '#0085ff',
  FACEBOOK: '#1877f2',
  PINTEREST: '#e60023',
};
