import { api } from '../api';
import type { ApiResponse } from '@/types';

// ─── Types ──────────────────────────────────────────────────

export interface StudioComposeResult {
  caption?: string;
  hashtags?: string[];
  suggestedPostType?: string;
  mediaPrompt?: string;
  hooks?: string[];
}

export interface StudioRewriteResult {
  caption?: string;
  hashtags?: string[];
  notes?: string;
}

export interface ImageGenResult {
  url?: string;
  base64?: string;
  revisedPrompt?: string;
}

export interface MediaSuggestion {
  prompt: string;
  style: string;
  rationale: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  available: boolean;
  reason?: string;
}

export interface IntelligenceResult {
  bestTimes?: string[];
  hashtags?: string[];
  contentScore?: number;
  tips?: string[];
  audienceInsight?: string;
}

export interface VideoAnalysisResult {
  retention?: { time: number; percent: number }[];
  rewatchHotspots?: { start: number; end: number; intensity: number }[];
  engagementMetrics?: Record<string, number>;
  dropOffPoints?: number[];
  suggestions?: string[];
}

export interface VideoClipResult {
  clips?: { start: number; end: number; title: string; score: number }[];
  suggestedCuts?: { start: number; end: number; rationale: string }[];
}

// ─── Endpoints ──────────────────────────────────────────────

export const studioApi = api.injectEndpoints({
  endpoints: (build) => ({
    // AI compose — generate full post from topic
    studioCompose: build.mutation<ApiResponse<StudioComposeResult>, { topic: string; platform?: string; tone?: string; postType?: string }>({
      query: (body) => ({ url: '/studio/compose', method: 'POST', body }),
    }),

    // AI rewrite — rewrite caption with intent
    studioRewrite: build.mutation<ApiResponse<StudioRewriteResult>, { caption: string; intent: string; platform?: string; tone?: string }>({
      query: (body) => ({ url: '/studio/rewrite', method: 'POST', body }),
    }),

    // Image generation via DALL-E
    studioGenerateImage: build.mutation<ApiResponse<ImageGenResult>, { prompt: string; size?: string; quality?: string; style?: string }>({
      query: (body) => ({ url: '/studio/image/generate', method: 'POST', body }),
    }),

    // Get media suggestions based on caption
    studioSuggestMedia: build.mutation<ApiResponse<{ prompts: MediaSuggestion[] }>, { caption: string; platform?: string; postType?: string }>({
      query: (body) => ({ url: '/studio/media/suggest', method: 'POST', body }),
    }),

    // Get integration statuses
    getStudioIntegrations: build.query<ApiResponse<{ integrations: IntegrationStatus[] }>, void>({
      query: () => '/studio/integrations',
      providesTags: ['Studio'],
    }),

    // Intelligence — best times, hashtags, score, tips
    studioIntelligence: build.mutation<ApiResponse<IntelligenceResult>, { caption: string; hashtags?: string; platform?: string; postType?: string }>({
      query: (body) => ({ url: '/studio/intelligence', method: 'POST', body }),
    }),

    // Video analysis — retention, rewatch, engagement
    studioVideoAnalysis: build.mutation<ApiResponse<VideoAnalysisResult>, { videoUrl: string; platform?: string }>({
      query: (body) => ({ url: '/studio/video/analyze', method: 'POST', body }),
    }),

    // Create clips / shorts from long-form video
    studioCreateClip: build.mutation<ApiResponse<VideoClipResult>, { videoUrl: string; duration?: number; style?: string }>({
      query: (body) => ({ url: '/studio/video/clip', method: 'POST', body }),
    }),
  }),
});

export const {
  useStudioComposeMutation,
  useStudioRewriteMutation,
  useStudioGenerateImageMutation,
  useStudioSuggestMediaMutation,
  useGetStudioIntegrationsQuery,
  useStudioIntelligenceMutation,
  useStudioVideoAnalysisMutation,
  useStudioCreateClipMutation,
} = studioApi;
