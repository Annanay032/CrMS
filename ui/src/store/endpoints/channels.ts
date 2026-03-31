import { api } from '../api';
import type { ContentPost, PostAnalytics, ApiResponse } from '@/types';

export interface ChannelOverviewData {
  platform: string;
  stats: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
  };
  analytics: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    videoViews: number;
    avgWatchTime: number;
    estimatedRevenue: number;
  };
  recentPosts: ContentPost[];
}

export interface ChannelAnalyticsData {
  posts: Array<{
    id: string;
    caption?: string;
    postType: string;
    publishedAt?: string;
    analytics?: PostAnalytics;
  }>;
  topPosts: Array<{
    id: string;
    caption?: string;
    postType: string;
    publishedAt?: string;
    analytics?: PostAnalytics;
  }>;
  followerTrend: Array<{
    date: string;
    followers: number;
    engagement: number;
    growthRate: number;
  }>;
}

export const channelsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getChannelOverview: build.query<ApiResponse<ChannelOverviewData>, string>({
      query: (platform) => `/channels/${platform.toLowerCase()}/overview`,
      providesTags: (_r, _e, platform) => [{ type: 'Content', id: `channel-${platform}` }],
    }),
    getChannelPosts: build.query<
      ApiResponse<ContentPost[]> & { pagination: { total: number; page: number; limit: number; totalPages: number } },
      { platform: string; page?: number; limit?: number; status?: string; postType?: string; search?: string }
    >({
      query: ({ platform, ...params }) => {
        const qs = new URLSearchParams();
        if (params.page) qs.set('page', String(params.page));
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.status) qs.set('status', params.status);
        if (params.postType) qs.set('postType', params.postType);
        if (params.search) qs.set('search', params.search);
        return `/channels/${platform.toLowerCase()}/posts?${qs.toString()}`;
      },
      providesTags: ['Content'],
    }),
    getChannelAnalytics: build.query<ApiResponse<ChannelAnalyticsData>, { platform: string; days?: number }>({
      query: ({ platform, days = 30 }) => `/channels/${platform.toLowerCase()}/analytics?days=${days}`,
    }),
  }),
});

export const {
  useGetChannelOverviewQuery,
  useGetChannelPostsQuery,
  useGetChannelAnalyticsQuery,
} = channelsApi;
