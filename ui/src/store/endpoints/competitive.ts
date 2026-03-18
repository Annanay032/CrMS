import { api } from '../api';
import type { ApiResponse } from '@/types';
import type { Competitor, CompetitorSnapshot } from '@/types';

export const competitiveApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCompetitors: build.query<ApiResponse<Competitor[]> & { pagination: { total: number } }, { page?: number }>({
      query: ({ page = 1 }) => `/competitive?page=${page}`,
      providesTags: ['Competitive'],
    }),
    getCompetitorById: build.query<ApiResponse<Competitor>, string>({
      query: (id) => `/competitive/${id}`,
      providesTags: ['Competitive'],
    }),
    createCompetitor: build.mutation<ApiResponse<Competitor>, { name: string; handles: Record<string, string>; platforms: string[]; notes?: string }>({
      query: (body) => ({ url: '/competitive', method: 'POST', body }),
      invalidatesTags: ['Competitive'],
    }),
    updateCompetitor: build.mutation<ApiResponse<Competitor>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/competitive/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Competitive'],
    }),
    deleteCompetitor: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/competitive/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Competitive'],
    }),
    getCompetitorSnapshots: build.query<ApiResponse<CompetitorSnapshot[]>, { competitorId: string; platform?: string; days?: number }>({
      query: ({ competitorId, platform, days = 30 }) => {
        const params = new URLSearchParams({ days: String(days) });
        if (platform) params.set('platform', platform);
        return `/competitive/${competitorId}/snapshots?${params}`;
      },
      providesTags: ['Competitive'],
    }),
    getBenchmarkData: build.query<ApiResponse<Array<{ id: string; name: string; handles: Record<string, string>; latestSnapshot: CompetitorSnapshot | null }>>, { platform: string }>({
      query: ({ platform }) => `/competitive/benchmark?platform=${platform}`,
      providesTags: ['Competitive'],
    }),
  }),
});

export const {
  useGetCompetitorsQuery,
  useGetCompetitorByIdQuery,
  useCreateCompetitorMutation,
  useUpdateCompetitorMutation,
  useDeleteCompetitorMutation,
  useGetCompetitorSnapshotsQuery,
  useGetBenchmarkDataQuery,
} = competitiveApi;
