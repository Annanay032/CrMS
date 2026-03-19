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

  }),
});

export const {
  useGetUsageSummaryQuery,
  useGetUsageHistoryQuery,
} = usageApi;
