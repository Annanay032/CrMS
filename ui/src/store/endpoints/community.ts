import { api } from '../api';
import type { ApiResponse } from '@/types';

interface Interaction {
  id: string;
  platform: string;
  interactionType: string;
  authorName?: string;
  content: string;
  sentiment?: string;
  aiSuggestion?: string;
  respondedAt?: string;
  createdAt: string;
}

interface CommunityStats {
  total: number;
  pending: number;
  positive: number;
  negative: number;
  questions: number;
  responseRate: number;
}

export const communityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInteractions: build.query<ApiResponse<Interaction[]> & { pagination?: { total: number } }, { page?: number; responded?: string }>({
      query: ({ page = 1, responded }) => {
        const qs = new URLSearchParams({ page: String(page) });
        if (responded) qs.set('responded', responded);
        return `/community?${qs}`;
      },
      providesTags: ['Analytics'],
    }),
    getCommunityStats: build.query<ApiResponse<CommunityStats>, void>({
      query: () => '/community/stats',
      providesTags: ['Analytics'],
    }),
    markResponded: build.mutation<ApiResponse<Interaction>, string>({
      query: (id) => ({ url: `/community/${id}/responded`, method: 'POST' }),
      invalidatesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetInteractionsQuery,
  useGetCommunityStatsQuery,
  useMarkRespondedMutation,
} = communityApi;
