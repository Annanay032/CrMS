import { api } from '../api';
import type { ApiResponse } from '@/types';
import type { ContentIdea, ContentTag, ContentTemplate } from '@/types';

export const ideaApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ─── Ideas ────────────────────────────────────────────────
    getIdeas: build.query<
      ApiResponse<ContentIdea[]> & { pagination: { total: number } },
      { status?: string; tagId?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.status) search.set('status', params.status);
        if (params.tagId) search.set('tagId', params.tagId);
        if (params.page) search.set('page', String(params.page));
        if (params.limit) search.set('limit', String(params.limit));
        return `/ideas?${search.toString()}`;
      },
      providesTags: ['Ideas'],
    }),

    getIdeaById: build.query<ApiResponse<ContentIdea>, string>({
      query: (id) => `/ideas/${id}`,
      providesTags: ['Ideas'],
    }),

    createIdea: build.mutation<ApiResponse<ContentIdea>, Partial<ContentIdea> & { title: string; tagIds?: string[] }>({
      query: (body) => ({ url: '/ideas', method: 'POST', body }),
      invalidatesTags: ['Ideas'],
    }),

    updateIdea: build.mutation<ApiResponse<ContentIdea>, { id: string; data: Partial<ContentIdea> & { tagIds?: string[] } }>({
      query: ({ id, data }) => ({ url: `/ideas/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Ideas'],
    }),

    deleteIdea: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/ideas/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Ideas'],
    }),

    // ─── Tags ─────────────────────────────────────────────────
    getTags: build.query<ApiResponse<ContentTag[]>, void>({
      query: () => '/ideas/tags/all',
      providesTags: ['Tags'],
    }),

    createTag: build.mutation<ApiResponse<ContentTag>, { name: string; color?: string }>({
      query: (body) => ({ url: '/ideas/tags', method: 'POST', body }),
      invalidatesTags: ['Tags'],
    }),

    updateTag: build.mutation<ApiResponse<ContentTag>, { id: string; data: Partial<{ name: string; color: string }> }>({
      query: ({ id, data }) => ({ url: `/ideas/tags/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Tags'],
    }),

    deleteTag: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/ideas/tags/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tags'],
    }),

    // ─── Templates ────────────────────────────────────────────
    getTemplates: build.query<ApiResponse<ContentTemplate[]>, void>({
      query: () => '/ideas/templates/all',
      providesTags: ['Templates'],
    }),

    createTemplate: build.mutation<ApiResponse<ContentTemplate>, { name: string; body: string; platform?: string; category: string }>({
      query: (body) => ({ url: '/ideas/templates', method: 'POST', body }),
      invalidatesTags: ['Templates'],
    }),
  }),
});

export const {
  useGetIdeasQuery,
  useGetIdeaByIdQuery,
  useCreateIdeaMutation,
  useUpdateIdeaMutation,
  useDeleteIdeaMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
} = ideaApi;
