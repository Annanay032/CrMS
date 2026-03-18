import { api } from '../api';
import type { ApiResponse } from '@/types';

export const agentsApi = api.injectEndpoints({
  endpoints: (build) => ({
    runAgent: build.mutation<ApiResponse<unknown>, { agentType: string; input: Record<string, unknown> }>({
      query: (body) => ({ url: '/agents/run', method: 'POST', body }),
      invalidatesTags: ['Agents'],
    }),
    generateContent: build.mutation<ApiResponse<{ suggestions: Array<{ title?: string; caption?: string; hashtags?: string[]; postType?: string }> }>, { niche: string; platform: string; count: number }>({
      query: (body) => ({ url: '/agents/content/generate', method: 'POST', body }),
    }),
    getTrends: build.mutation<ApiResponse<{ trends: Array<Record<string, unknown>>; summary?: string }>, { niche: string[]; platforms: string[] }>({
      query: (body) => ({ url: '/agents/trends', method: 'POST', body }),
    }),
    getAnalyticsInsights: build.mutation<ApiResponse<Record<string, unknown>>, { period: string }>({
      query: (body) => ({ url: '/agents/analytics/insights', method: 'POST', body }),
    }),
    getEngagementSuggestions: build.mutation<ApiResponse<{ suggestions: Array<Record<string, unknown>> }>, Record<string, unknown>>({
      query: (body) => ({ url: '/agents/engagement/suggestions', method: 'POST', body }),
    }),
  }),
});

export const {
  useRunAgentMutation,
  useGenerateContentMutation,
  useGetTrendsMutation,
  useGetAnalyticsInsightsMutation,
  useGetEngagementSuggestionsMutation,
} = agentsApi;
