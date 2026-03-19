export const PLATFORM_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'SNAPCHAT', label: 'Snapchat' },
  { value: 'THREADS', label: 'Threads' },
] as const;

export const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'followers', label: 'Followers' },
  { value: 'engagement', label: 'Engagement Rate' },
  { value: 'reliability', label: 'Reliability Score' },
] as const;
