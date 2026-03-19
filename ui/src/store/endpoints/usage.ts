import { api } from '../api';
import type { ApiResponse, UsageSummary, UsageHistoryEntry } from '@/types';

export const usageApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsageSummary: build.query<ApiResponse<UsageSummary>, void>({
      query: () => '/usage',
      providesTags: ['Usage'],
    }),

    getUsageHistory: build.query<ApiResponse<UsageHistoryEntry[]>, { days?: number }>({
      query: ({ days } = {}) => ({ url: '/usage/history', params: { days } }),
      providesTags: ['Usage'],
    }),

    updateUsageTier: build.mutation<ApiResponse<unknown>, { tier: string }>({
      query: (body) => ({ url: '/usage/tier', method: 'PATCH', body }),
      invalidatesTags: ['Usage'],
    }),
  }),
});

export const {
  useGetUsageSummaryQuery,
  useGetUsageHistoryQuery,
  useUpdateUsageTierMutation,
} = usageApi;
