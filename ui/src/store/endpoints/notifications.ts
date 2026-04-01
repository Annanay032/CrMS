import { api } from '../api';
import type { ApiResponse, NotificationsResponse } from '@/types';

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<ApiResponse<NotificationsResponse>, { page?: number; limit?: number; unreadOnly?: boolean }>({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notifications'],
    }),

    markNotificationRead: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    markAllNotificationsRead: build.mutation<ApiResponse<void>, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),

    chatWithAgent: build.mutation<ApiResponse<import('@/types').ChatResponse>, { message: string; history?: Array<{ role: 'user' | 'ai'; content: string }>; attachments?: Array<{ url: string; name: string; type: string }> }>({
      query: (body) => ({ url: '/agents/chat', method: 'POST', body }),
      invalidatesTags: ['Agents'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useChatWithAgentMutation,
} = notificationsApi;
