export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#e2e8f0',
  REVIEW: '#fde68a',
  APPROVED: '#bfdbfe',
  SCHEDULED: '#c7d2fe',
  PUBLISHED: '#bbf7d0',
  FAILED: '#fecaca',
};

export const PLATFORM_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
];

export const POST_TYPE_OPTIONS = [
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'REEL', label: 'Reel' },
  { value: 'STORY', label: 'Story' },
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'SHORT', label: 'Short' },
];
