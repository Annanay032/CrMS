import { api } from '../api';
import type { ApiResponse } from '@/types';
import type { Interaction, SavedReply, VoiceProfile, CommunityStats } from '@/pages/community/types';

interface InboxParams {
  page?: number;
  responded?: string;
  isRead?: string;
  caseStatus?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'priority';
  platform?: string;
  sentiment?: string;
}

export const communityApi = api.injectEndpoints({
  endpoints: (build) => ({
    /* Inbox */
    getInteractions: build.query<ApiResponse<Interaction[]> & { pagination?: { total: number; totalPages: number } }, InboxParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
        if (!qs.has('page')) qs.set('page', '1');
        return `/community?${qs}`;
      },
      providesTags: ['Community'],
    }),
    getInteractionById: build.query<ApiResponse<Interaction>, string>({
      query: (id) => `/community/${id}`,
      providesTags: ['Community'],
    }),
    getCommunityStats: build.query<ApiResponse<CommunityStats>, void>({
      query: () => '/community/stats',
      providesTags: ['Community'],
    }),
    markResponded: build.mutation<ApiResponse<Interaction>, string>({
      query: (id) => ({ url: `/community/${id}/responded`, method: 'POST' }),
      invalidatesTags: ['Community'],
    }),
    markRead: build.mutation<ApiResponse<Interaction>, string>({
      query: (id) => ({ url: `/community/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Community'],
    }),
    markBulkRead: build.mutation<ApiResponse<{ count: number }>, string[]>({
      query: (ids) => ({ url: '/community/bulk-read', method: 'POST', body: { ids } }),
      invalidatesTags: ['Community'],
    }),
    updateCase: build.mutation<ApiResponse<Interaction>, { id: string; caseStatus?: string; priority?: string; assignedTo?: string | null; tags?: string[] }>({
      query: ({ id, ...body }) => ({ url: `/community/${id}/case`, method: 'PATCH', body }),
      invalidatesTags: ['Community'],
    }),
    assignInteraction: build.mutation<ApiResponse<Interaction>, { id: string; assignedTo: string | null }>({
      query: ({ id, assignedTo }) => ({ url: `/community/${id}/assign`, method: 'PATCH', body: { assignedTo } }),
      invalidatesTags: ['Community'],
    }),

    /* Saved Replies */
    getSavedReplies: build.query<ApiResponse<SavedReply[]>, void>({
      query: () => '/community/saved-replies/list',
      providesTags: ['Community'],
    }),
    createSavedReply: build.mutation<ApiResponse<SavedReply>, { title: string; body: string; tags?: string[]; shortcut?: string }>({
      query: (body) => ({ url: '/community/saved-replies', method: 'POST', body }),
      invalidatesTags: ['Community'],
    }),
    updateSavedReply: build.mutation<ApiResponse<SavedReply>, { id: string; title?: string; body?: string; tags?: string[]; shortcut?: string }>({
      query: ({ id, ...body }) => ({ url: `/community/saved-replies/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Community'],
    }),
    deleteSavedReply: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/community/saved-replies/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Community'],
    }),
    useSavedReply: build.mutation<ApiResponse<SavedReply>, string>({
      query: (id) => ({ url: `/community/saved-replies/${id}/use`, method: 'POST' }),
      invalidatesTags: ['Community'],
    }),

    /* Voice Profile */
    getVoiceProfile: build.query<ApiResponse<VoiceProfile | null>, void>({
      query: () => '/community/voice-profile/me',
      providesTags: ['Community'],
    }),
    upsertVoiceProfile: build.mutation<ApiResponse<VoiceProfile>, { tonePreferences: string[]; vocabulary: string[]; formalityLevel: number; personalityTraits?: string[]; sampleReplies?: string[] }>({
      query: (body) => ({ url: '/community/voice-profile', method: 'PUT', body }),
      invalidatesTags: ['Community'],
    }),

    /* Threads */
    getThreads: build.query<ApiResponse<unknown[]>, { page?: number; limit?: number }>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.page) qs.set('page', String(params.page));
        if (params.limit) qs.set('limit', String(params.limit));
        return `/community/threads?${qs}`;
      },
      providesTags: ['Community'],
    }),

    /* Inbox Channels */
    getChannels: build.query<ApiResponse<unknown[]>, void>({
      query: () => '/community/channels',
      providesTags: ['Community'],
    }),
    upsertChannel: build.mutation<ApiResponse<unknown>, { type: string; label?: string; config?: unknown }>({
      query: (body) => ({ url: '/community/channels', method: 'POST', body }),
      invalidatesTags: ['Community'],
    }),
    deleteChannel: build.mutation<ApiResponse<void>, string>({
      query: (type) => ({ url: `/community/channels/${type}`, method: 'DELETE' }),
      invalidatesTags: ['Community'],
    }),

    /* Star / Unstar */
    starInteraction: build.mutation<ApiResponse<Interaction>, string>({
      query: (id) => ({ url: `/community/${id}/star`, method: 'POST' }),
      invalidatesTags: ['Community'],
    }),
    unstarInteraction: build.mutation<ApiResponse<Interaction>, string>({
      query: (id) => ({ url: `/community/${id}/star`, method: 'DELETE' }),
      invalidatesTags: ['Community'],
    }),
  }),
});

export const {
  useGetInteractionsQuery,
  useGetInteractionByIdQuery,
  useGetCommunityStatsQuery,
  useMarkRespondedMutation,
  useMarkReadMutation,
  useMarkBulkReadMutation,
  useUpdateCaseMutation,
  useAssignInteractionMutation,
  useGetSavedRepliesQuery,
  useCreateSavedReplyMutation,
  useUpdateSavedReplyMutation,
  useDeleteSavedReplyMutation,
  useUseSavedReplyMutation,
  useGetVoiceProfileQuery,
  useUpsertVoiceProfileMutation,
  useGetThreadsQuery,
  useGetChannelsQuery,
  useUpsertChannelMutation,
  useDeleteChannelMutation,
  useStarInteractionMutation,
  useUnstarInteractionMutation,
} = communityApi;
