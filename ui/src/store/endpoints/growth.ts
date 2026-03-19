import { api } from '../api';
import type { ApiResponse } from '@/types';

interface DailyRecommendation {
  title: string;
  description: string;
  targetPlatform: string;
  contentType: string;
  hooks: string[];
  bestPostingTime: string;
  estimatedReach: string;
  trendReference: string;
  reasoning: string;
}

interface Hook {
  text: string;
  type: string;
  estimatedStrength: number;
  bestForFormat: string;
  reasoning: string;
}

interface ViralityPrediction {
  viralityScore: number;
  confidence: number;
  factors: Array<{ name: string; score: number; impact: string; detail: string }>;
  trendAlignment: unknown;
  suggestions: string[];
  estimatedReach: string;
  bestTimeToPost: string;
}

interface WeeklyPlan {
  weekGoal: string;
  days: Array<{
    dayOfWeek: string;
    platform: string;
    contentType: string;
    title: string;
    description: string;
    hook: string;
    trendReference: string;
    purpose: string;
    bestTime: string;
  }>;
  weeklyMetrics: unknown;
  tips: string[];
}

export const growthApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDailyRecommendation: build.query<ApiResponse<DailyRecommendation>, void>({
      query: () => ({ url: '/agents/growth/daily', method: 'POST' }),
      providesTags: ['Growth'],
    }),
    generateHooks: build.mutation<ApiResponse<{ hooks: Hook[] }>, { topic: string; platform: string; tone?: string; count?: number }>({
      query: (body) => ({ url: '/agents/growth/hooks', method: 'POST', body }),
    }),
    predictVirality: build.mutation<ApiResponse<ViralityPrediction>, { title: string; description?: string; platform: string; contentType: string; niche: string[] }>({
      query: (body) => ({ url: '/agents/growth/predict', method: 'POST', body }),
    }),
    getWeeklyPlan: build.query<ApiResponse<WeeklyPlan>, void>({
      query: () => ({ url: '/agents/growth/weekly-plan', method: 'POST' }),
      providesTags: ['Growth'],
    }),
  }),
});

export const {
  useGetDailyRecommendationQuery,
  useGenerateHooksMutation,
  usePredictViralityMutation,
  useGetWeeklyPlanQuery,
} = growthApi;
