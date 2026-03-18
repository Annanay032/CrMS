import type { UpcomingPost, RecentCampaign } from './types';

export const MOCK_UPCOMING_POSTS: UpcomingPost[] = [
  { title: 'Morning Workout Routine', platform: 'Instagram', time: 'Today 9:00 AM', status: 'SCHEDULED' },
  { title: 'Nutrition Tips Video', platform: 'YouTube', time: 'Tomorrow 2:00 PM', status: 'REVIEW' },
  { title: 'Quick HIIT Challenge', platform: 'TikTok', time: 'Wed 6:00 PM', status: 'DRAFT' },
];

export const MOCK_RECENT_CAMPAIGNS: RecentCampaign[] = [
  { title: 'Summer Fitness Challenge 2026', creators: 12, status: 'ACTIVE' },
  { title: 'New Product Launch', creators: 8, status: 'ACTIVE' },
  { title: 'Brand Awareness Q1', creators: 15, status: 'COMPLETED' },
];

export const POST_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'green',
  REVIEW: 'orange',
  DRAFT: 'default',
};

export const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green',
  COMPLETED: 'default',
};
