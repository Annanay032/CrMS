import { api } from '../api';
import type { ApiResponse } from '@/types';

export interface ConnectedAccount {
  id: string;
  provider: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK';
  providerAccountId: string;
  connected: boolean;
  connectedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  stats: {
    handle: string | null;
    followers: number;
    engagementRate: number;
    avgLikes: number;
    avgComments: number;
    avgViews: number;
  } | null;
}

export interface PlatformAvailability {
  provider: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK';
  oauthConfigured: boolean;
  manualConnectAvailable: boolean;
}

interface AccountsResponse {
  accounts: ConnectedAccount[];
  platforms: PlatformAvailability[];
}

export const accountsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConnectedAccounts: build.query<ApiResponse<AccountsResponse>, void>({
      query: () => '/accounts',
      providesTags: ['Accounts'],
    }),
    initiateOAuth: build.query<ApiResponse<{ url: string }>, string>({
      query: (platform) => `/accounts/connect/${platform.toLowerCase()}`,
    }),
    manualConnect: build.mutation<
      ApiResponse<{ id: string; provider: string; providerAccountId: string }>,
      { platform: string; handle: string; accessToken?: string }
    >({
      query: ({ platform, ...body }) => ({
        url: `/accounts/connect/${platform.toLowerCase()}/manual`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Accounts', 'Auth'],
    }),
    disconnectAccount: build.mutation<ApiResponse<{ provider: string; disconnected: boolean }>, string>({
      query: (provider) => ({
        url: `/accounts/${provider.toLowerCase()}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Accounts', 'Auth'],
    }),
    refreshAccountToken: build.mutation<ApiResponse<{ provider: string; refreshed: boolean }>, string>({
      query: (provider) => ({
        url: `/accounts/${provider.toLowerCase()}/refresh`,
        method: 'POST',
      }),
      invalidatesTags: ['Accounts'],
    }),
  }),
});

export const {
  useGetConnectedAccountsQuery,
  useLazyInitiateOAuthQuery,
  useManualConnectMutation,
  useDisconnectAccountMutation,
  useRefreshAccountTokenMutation,
} = accountsApi;
