import { z } from 'zod';

// ─── Schema ─────────────────────────────────────────────────
export const composeSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'REDDIT']),
  postType: z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT', 'THREAD']),
  caption: z.string().max(40000).optional(),
  hashtags: z.string().optional(),
  scheduledAt: z.string().optional(),
  firstComment: z.string().max(2200).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export type ComposeForm = z.infer<typeof composeSchema>;

// ─── Chat ───────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  action?: string;
}

// ─── Intel ──────────────────────────────────────────────────
export interface IntelData {
  bestTimes?: string[];
  hashtags?: string[];
  contentScore?: number;
  tips?: string[];
  audienceInsight?: string;
}

// ─── Video ──────────────────────────────────────────────────
export interface VideoFileInfo {
  url: string;
  name: string;
  size: number;
  duration?: number;
}

// ─── Thread ─────────────────────────────────────────────────
export interface ThreadEntry {
  id: string;
  text: string;
  media?: string;
}

// ─── Constants ──────────────────────────────────────────────
export const PLATFORM_LIMITS: Record<string, number> = {
  INSTAGRAM: 2200, YOUTUBE: 5000, TIKTOK: 2200, TWITTER: 280,
  LINKEDIN: 3000, THREADS: 500, BLUESKY: 300, FACEBOOK: 5000,
  PINTEREST: 500, REDDIT: 40000,
};
