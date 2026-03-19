import { api } from '../api';
import type { ContentPost, CalendarNote, ContentTemplate, ApiResponse } from '@/types';

export const contentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCalendar: build.query<ApiResponse<{ posts: ContentPost[]; notes: CalendarNote[] }>, { month: number; year: number }>({
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

    // ── Autosave ──
    autosavePost: build.mutation<ApiResponse<ContentPost>, Record<string, unknown>>({
      query: (body) => ({ url: '/content/autosave', method: 'PUT', body }),
    }),

    // ── Search ──
    searchContent: build.query<ApiResponse<ContentPost[]> & { pagination: { total: number } }, { q: string; page?: number }>({
      query: ({ q, page = 1 }) => `/content/search?q=${encodeURIComponent(q)}&page=${page}`,
    }),

    // ── Queue ──
    shuffleQueue: build.mutation<ApiResponse<ContentPost[]>, { platform: string }>({
      query: (body) => ({ url: '/content/queue/shuffle', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),
    injectIntoQueue: build.mutation<ApiResponse<ContentPost[]>, { postId: string; position: number }>({
      query: (body) => ({ url: '/content/queue/inject', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),

    // ── Threads ──
    createThread: build.mutation<ApiResponse<{ parentPost: ContentPost; threadParts: ContentPost[] }>, Record<string, unknown>>({
      query: (body) => ({ url: '/content/threads', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),
    getThread: build.query<ApiResponse<ContentPost & { threadParts: ContentPost[] }>, string>({
      query: (id) => `/content/threads/${id}`,
    }),

    // ── Calendar Notes ──
    createCalendarNote: build.mutation<ApiResponse<CalendarNote>, Record<string, unknown>>({
      query: (body) => ({ url: '/content/notes', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),
    updateCalendarNote: build.mutation<ApiResponse<CalendarNote>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/content/notes/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Content'],
    }),
    deleteCalendarNote: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/content/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Content'],
    }),

    // ── Templates ──
    getTemplates: build.query<ApiResponse<ContentTemplate[]>, { platform?: string } | void>({
      query: (params) => `/content/templates${params?.platform ? `?platform=${params.platform}` : ''}`,
      providesTags: ['Templates'],
    }),
    createTemplate: build.mutation<ApiResponse<ContentTemplate>, Record<string, unknown>>({
      query: (body) => ({ url: '/content/templates', method: 'POST', body }),
      invalidatesTags: ['Templates'],
    }),
    deleteTemplate: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/content/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Templates'],
    }),
  }),
});

export const {
  useGetCalendarQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPostsByStatusQuery,
  useAutosavePostMutation,
  useSearchContentQuery,
  useShuffleQueueMutation,
  useInjectIntoQueueMutation,
  useCreateThreadMutation,
  useGetThreadQuery,
  useCreateCalendarNoteMutation,
  useUpdateCalendarNoteMutation,
  useDeleteCalendarNoteMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
} = contentApi;
