// ─── Character limits per platform ──────────────────────────
export const PLATFORM_LIMITS: Record<string, number> = {
  INSTAGRAM: 2200, YOUTUBE: 5000, TIKTOK: 2200, TWITTER: 280,
  LINKEDIN: 3000, THREADS: 500, BLUESKY: 300, FACEBOOK: 5000,
  PINTEREST: 500, REDDIT: 40000,
};

// Re-export content-level constants so compose consumers import from one place
export {
  PLATFORM_OPTIONS,
  POST_TYPE_OPTIONS,
  PLATFORM_POST_TYPES,
  PLATFORM_DEFAULT_TYPE,
  POST_TYPE_COMPATIBLE_PLATFORMS,
  getCompatiblePlatforms,
} from '@/pages/content/constants';
