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
    getContentTypeStats: build.query<ApiResponse<{ byType: Record<string, unknown>; byPlatform: Record<string, unknown>; totalPosts: number }>, { period: string }>({
      query: ({ period }) => `/dashboard/content-types?period=${period}`,
      providesTags: ['Analytics'],
    }),
    getAudienceInsights: build.query<ApiResponse<Array<Record<string, unknown>>>, { platform?: string }>({
      query: ({ platform }) => `/dashboard/audience${platform ? `?platform=${platform}` : ''}`,
      providesTags: ['Analytics'],
    }),
    // Reports
    getReports: build.query<ApiResponse<Array<Record<string, unknown>>> & { pagination: Record<string, number> }, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 10, status }) => `/dashboard/reports?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
      providesTags: ['Reports'],
    }),
    getReport: build.query<ApiResponse<Record<string, unknown>>, string>({
      query: (id) => `/dashboard/reports/${id}`,
      providesTags: ['Reports'],
    }),
    createReport: build.mutation<ApiResponse<Record<string, unknown>>, { title: string; description?: string; dateRangeStart: string; dateRangeEnd: string; metrics: string[]; platforms?: string[]; format?: string; schedule?: string }>({
      query: (body) => ({ url: '/dashboard/reports', method: 'POST', body }),
      invalidatesTags: ['Reports'],
    }),
    updateReport: build.mutation<ApiResponse<Record<string, unknown>>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/dashboard/reports/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Reports'],
    }),
    deleteReport: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/dashboard/reports/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reports'],
    }),
    generateReport: build.mutation<ApiResponse<{ id: string; status: string }>, string>({
      query: (id) => ({ url: `/dashboard/reports/${id}/generate`, method: 'POST' }),
      invalidatesTags: ['Reports'],
    }),
    getPostAnalytics: build.query<ApiResponse<PostAnalyticsDetail>, string>({
      query: (postId) => `/dashboard/posts/${postId}/analytics`,
      providesTags: ['Analytics'],
    }),
  }),
});

export interface PostAnalyticsDetail {
  id: string;
  caption?: string;
  platform: string;
  postType: string;
  status: string;
  publishedAt?: string;
  scheduledAt?: string;
  mediaUrls: string[];
  analytics?: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    videoViews: number;
    avgWatchTime: number;
    profileVisits: number;
    estimatedRevenue?: number;
    audienceDemographics?: Record<string, unknown>;
  };
  recentComments: Array<{
    id: string;
    type: string;
    authorName?: string;
    content?: string;
    createdAt: string;
  }>;
  attributedRevenue: number;
}

export const {
  useGetDashboardStatsQuery,
  useGetAnalyticsDashboardQuery,
  useGetContentTypeStatsQuery,
  useGetAudienceInsightsQuery,
  useGetReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useGenerateReportMutation,
  useGetPostAnalyticsQuery,
} = dashboardApi;
