import { api } from '../api';
import type { ContentPost, ApiResponse } from '@/types';

export const contentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCalendar: build.query<ApiResponse<ContentPost[]>, { month: number; year: number }>({
      query: ({ month, year }) => `/content/calendar?month=${month}&year=${year}`,
      providesTags: ['Content'],
    }),
    createPost: build.mutation<ApiResponse<ContentPost>, Record<string, unknown>>({
      query: (body) => ({ url: '/content', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),
    updatePost: build.mutation<ApiResponse<ContentPost>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/content/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Content'],
    }),
    deletePost: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/content/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Content'],
    }),
    getPostsByStatus: build.query<ApiResponse<ContentPost[]> & { pagination: { total: number } }, { status: string; page?: number }>({
      query: ({ status, page = 1 }) => `/content/status/${status}?page=${page}`,
      providesTags: ['Content'],
    }),
  }),
});

export const {
  useGetCalendarQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPostsByStatusQuery,
} = contentApi;
