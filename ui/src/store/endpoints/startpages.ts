import { api } from '../api';
import type { StartPage, StartPageLink, StartPageAnalyticsSummary, ApiResponse } from '@/types';

export const startpagesApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ─── Pages ───────────────────────────────────────────────
    getMyPages: build.query<ApiResponse<StartPage[]>, void>({
      query: () => '/startpages',
      providesTags: ['StartPages'],
    }),
    getPage: build.query<ApiResponse<StartPage>, string>({
      query: (id) => `/startpages/${id}`,
      providesTags: ['StartPages'],
    }),
    getPublicPage: build.query<ApiResponse<StartPage>, string>({
      query: (slug) => `/startpages/p/${slug}`,
    }),
    createPage: build.mutation<ApiResponse<StartPage>, Record<string, unknown>>({
      query: (body) => ({ url: '/startpages', method: 'POST', body }),
      invalidatesTags: ['StartPages'],
    }),
    updatePage: build.mutation<ApiResponse<StartPage>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/startpages/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['StartPages'],
    }),
    deletePage: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/startpages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StartPages'],
    }),

    // ─── Links ───────────────────────────────────────────────
    addLink: build.mutation<ApiResponse<StartPageLink>, { pageId: string; data: Record<string, unknown> }>({
      query: ({ pageId, data }) => ({ url: `/startpages/${pageId}/links`, method: 'POST', body: data }),
      invalidatesTags: ['StartPages'],
    }),
    updateLink: build.mutation<ApiResponse<StartPageLink>, { pageId: string; linkId: string; data: Record<string, unknown> }>({
      query: ({ pageId, linkId, data }) => ({ url: `/startpages/${pageId}/links/${linkId}`, method: 'PUT', body: data }),
      invalidatesTags: ['StartPages'],
    }),
    deleteLink: build.mutation<ApiResponse<void>, { pageId: string; linkId: string }>({
      query: ({ pageId, linkId }) => ({ url: `/startpages/${pageId}/links/${linkId}`, method: 'DELETE' }),
      invalidatesTags: ['StartPages'],
    }),
    reorderLinks: build.mutation<ApiResponse<StartPageLink[]>, { pageId: string; linkIds: string[] }>({
      query: ({ pageId, linkIds }) => ({ url: `/startpages/${pageId}/links/reorder`, method: 'PUT', body: { linkIds } }),
      invalidatesTags: ['StartPages'],
    }),

    // ─── Click Tracking ──────────────────────────────────────
    trackLinkClick: build.mutation<ApiResponse<void>, { pageId: string; linkId: string }>({
      query: ({ pageId, linkId }) => ({ url: `/startpages/p/${pageId}/links/${linkId}/click`, method: 'POST' }),
    }),

    // ─── Analytics ───────────────────────────────────────────
    getPageAnalytics: build.query<ApiResponse<StartPageAnalyticsSummary>, { pageId: string; days?: number }>({
      query: ({ pageId, days }) => `/startpages/${pageId}/analytics${days ? `?days=${days}` : ''}`,
      providesTags: ['StartPages'],
    }),

    // ─── Slug Check ──────────────────────────────────────────
    checkSlug: build.query<ApiResponse<{ available: boolean }>, { slug: string; excludePageId?: string }>({
      query: ({ slug, excludePageId }) => {
        const params = new URLSearchParams({ slug });
        if (excludePageId) params.set('excludePageId', excludePageId);
        return `/startpages/check-slug?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetMyPagesQuery,
  useGetPageQuery,
  useGetPublicPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
  useAddLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
  useReorderLinksMutation,
  useTrackLinkClickMutation,
  useGetPageAnalyticsQuery,
  useLazyCheckSlugQuery,
} = startpagesApi;
