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
  { value: 'TWITTER', label: 'X (Twitter)' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'THREADS', label: 'Threads' },
  { value: 'BLUESKY', label: 'Bluesky' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'REDDIT', label: 'Reddit' },
];

export const POST_TYPE_OPTIONS = [
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'REEL', label: 'Reel' },
  { value: 'STORY', label: 'Story' },
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'SHORT', label: 'Short' },
  { value: 'THREAD', label: 'Thread' },
];

/** Platform → allowed post types with labels */
export const PLATFORM_POST_TYPES: Record<string, { value: string; label: string }[]> = {
  INSTAGRAM: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'REEL', label: 'Reel' },
    { value: 'STORY', label: 'Story' },
    { value: 'CAROUSEL', label: 'Carousel' },
  ],
  YOUTUBE: [
    { value: 'VIDEO', label: 'Video' },
    { value: 'SHORT', label: 'Short' },
  ],
  TIKTOK: [
    { value: 'VIDEO', label: 'Video' },
    { value: 'SHORT', label: 'Short' },
    { value: 'IMAGE', label: 'Image' },
    { value: 'CAROUSEL', label: 'Carousel' },
  ],
  TWITTER: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'THREAD', label: 'Thread' },
  ],
  LINKEDIN: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'CAROUSEL', label: 'Document' },
  ],
  THREADS: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'CAROUSEL', label: 'Carousel' },
  ],
  BLUESKY: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
  ],
  FACEBOOK: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'REEL', label: 'Reel' },
    { value: 'STORY', label: 'Story' },
    { value: 'CAROUSEL', label: 'Carousel' },
  ],
  PINTEREST: [
    { value: 'IMAGE', label: 'Pin' },
    { value: 'VIDEO', label: 'Video Pin' },
  ],
  REDDIT: [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'THREAD', label: 'Text Post' },
  ],
};

/** Default post type when switching platforms */
export const PLATFORM_DEFAULT_TYPE: Record<string, string> = {
  INSTAGRAM: 'IMAGE',
  YOUTUBE: 'VIDEO',
  TIKTOK: 'SHORT',
  TWITTER: 'IMAGE',
  LINKEDIN: 'IMAGE',
  THREADS: 'IMAGE',
  BLUESKY: 'IMAGE',
  FACEBOOK: 'IMAGE',
  PINTEREST: 'IMAGE',
  REDDIT: 'THREAD',
};

/**
 * Reverse map: post type → platforms that support it.
 * Derived from PLATFORM_POST_TYPES above.
 */
export const POST_TYPE_COMPATIBLE_PLATFORMS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [platform, types] of Object.entries(PLATFORM_POST_TYPES)) {
    for (const t of types) {
      if (!map[t.value]) map[t.value] = [];
      map[t.value].push(platform);
    }
  }
  return map;
})();

/** Get platforms that are compatible with a given post type, excluding a specific platform */
export function getCompatiblePlatforms(postType: string, excludePlatform: string) {
  const compatible = POST_TYPE_COMPATIBLE_PLATFORMS[postType] ?? [];
  return PLATFORM_OPTIONS.filter(
    (o) => o.value !== excludePlatform && compatible.includes(o.value),
  );
}
