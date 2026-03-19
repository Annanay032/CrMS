import { api } from '../api';
import type { ApiResponse, UserSettings } from '@/types';

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserSettings: build.query<ApiResponse<UserSettings>, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),

    updateUserSettings: build.mutation<ApiResponse<UserSettings>, Partial<UserSettings>>({
      query: (body) => ({ url: '/settings', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} = settingsApi;
