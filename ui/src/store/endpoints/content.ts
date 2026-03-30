import { api } from '../api';
import type { ContentPost, CalendarNote, ContentTemplate, PostActivityLog, ApiResponse } from '@/types';

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

    // ── Post Detail ──
    getPost: build.query<ApiResponse<ContentPost>, string>({
      query: (id) => `/content/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Content', id }],
    }),

    // ── List Posts ──
    listPosts: build.query<ApiResponse<ContentPost[]> & { pagination: { total: number; page: number; limit: number; totalPages: number } }, { page?: number; limit?: number; platform?: string; status?: string; postType?: string; search?: string }>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.page) qs.set('page', String(params.page));
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.platform) qs.set('platform', params.platform);
        if (params.status) qs.set('status', params.status);
        if (params.postType) qs.set('postType', params.postType);
        if (params.search) qs.set('search', params.search);
        return `/content/list?${qs.toString()}`;
      },
      providesTags: ['Content'],
    }),

    // ── Cross-platform Group ──
    getCrossplatformGroup: build.query<ApiResponse<ContentPost[]>, string>({
      query: (groupId) => `/content/group/${groupId}`,
      providesTags: ['Content'],
    }),

    // ── Activity Log ──
    getPostActivity: build.query<ApiResponse<PostActivityLog[]> & { pagination: { total: number } }, { id: string; page?: number }>({
      query: ({ id, page = 1 }) => `/content/${id}/activity?page=${page}`,
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
  useGetPostQuery,
  useListPostsQuery,
  useGetCrossplatformGroupQuery,
  useGetPostActivityQuery,
} = contentApi;
