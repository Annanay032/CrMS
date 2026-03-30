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
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  /** Structured data from AI for direct apply */
  applyData?: {
    caption?: string;
    hashtags?: string[];
    firstComment?: string;
    scheduledAt?: string;
    mediaUrl?: string;
  };
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
  serverUrl?: string;
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

// ─── Media strategy ─────────────────────────────────────────
export type MediaStrategy = 'reuse' | 'customize';

// ─── Per-platform state ─────────────────────────────────────
export interface PlatformEditorState {
  caption: string;
  hashtags: string;
  mediaUrls: string[];
  videoFile: VideoFileInfo | null;
  thumbnailUrl?: string;
}
