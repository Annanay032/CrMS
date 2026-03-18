import { api } from '../api';
import type { ApiResponse } from '@/types';

export const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<ApiResponse<Record<string, unknown>>, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Analytics'],
    }),
    getAnalyticsDashboard: build.query<ApiResponse<Record<string, unknown>>, { period: string }>({
      query: ({ period }) => `/dashboard/analytics?period=${period}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetAnalyticsDashboardQuery } = dashboardApi;
