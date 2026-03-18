import { api } from '../api';
import type { ApiResponse } from '@/types';
import type { ListeningQuery, Mention, SentimentSnapshot, SentimentSummary } from '@/types';

export const listeningApi = api.injectEndpoints({
  endpoints: (build) => ({
    getListeningQueries: build.query<ApiResponse<ListeningQuery[]> & { pagination: { total: number } }, { page?: number }>({
      query: ({ page = 1 }) => `/listening?page=${page}`,
      providesTags: ['Listening'],
    }),
    getListeningQueryById: build.query<ApiResponse<ListeningQuery>, string>({
      query: (id) => `/listening/${id}`,
      providesTags: ['Listening'],
    }),
    createListeningQuery: build.mutation<ApiResponse<ListeningQuery>, { name: string; keywords: string[]; platforms: string[] }>({
      query: (body) => ({ url: '/listening', method: 'POST', body }),
      invalidatesTags: ['Listening'],
    }),
    updateListeningQuery: build.mutation<ApiResponse<ListeningQuery>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/listening/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Listening'],
    }),
    deleteListeningQuery: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/listening/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Listening'],
    }),
    getMentions: build.query<ApiResponse<Mention[]> & { pagination: { total: number } }, { queryId: string; platform?: string; sentiment?: string; page?: number }>({
      query: ({ queryId, platform, sentiment, page = 1 }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (platform) params.set('platform', platform);
        if (sentiment) params.set('sentiment', sentiment);
        return `/listening/${queryId}/mentions?${params}`;
      },
      providesTags: ['Listening'],
    }),
    getSentimentTimeline: build.query<ApiResponse<SentimentSnapshot[]>, { queryId: string; days?: number }>({
      query: ({ queryId, days = 30 }) => `/listening/${queryId}/sentiment/timeline?days=${days}`,
      providesTags: ['Listening'],
    }),
    getSentimentSummary: build.query<ApiResponse<SentimentSummary>, string>({
      query: (queryId) => `/listening/${queryId}/sentiment/summary`,
      providesTags: ['Listening'],
    }),
  }),
});

export const {
  useGetListeningQueriesQuery,
  useGetListeningQueryByIdQuery,
  useCreateListeningQueryMutation,
  useUpdateListeningQueryMutation,
  useDeleteListeningQueryMutation,
  useGetMentionsQuery,
  useGetSentimentTimelineQuery,
  useGetSentimentSummaryQuery,
} = listeningApi;
