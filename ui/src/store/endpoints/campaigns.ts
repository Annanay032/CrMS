import { api } from '../api';
import type { Campaign, CampaignMatch, ApiResponse } from '@/types';

export const campaignsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCampaigns: build.query<ApiResponse<Campaign[]>, void>({
      query: () => '/campaigns',
      providesTags: ['Campaigns'],
    }),
    getMyCampaigns: build.query<ApiResponse<Campaign[]>, void>({
      query: () => '/campaigns/my',
      providesTags: ['Campaigns'],
    }),
    getCampaign: build.query<ApiResponse<Campaign>, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: ['Campaigns'],
    }),
    createCampaign: build.mutation<ApiResponse<Campaign>, Partial<Campaign> & { targetNiche?: string[] }>({
      query: (body) => ({ url: '/campaigns', method: 'POST', body }),
      invalidatesTags: ['Campaigns'],
    }),
    updateCampaignStatus: build.mutation<ApiResponse<Campaign>, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/campaigns/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Campaigns'],
    }),
    respondToMatch: build.mutation<ApiResponse<CampaignMatch>, { matchId: string; accept: boolean }>({
      query: ({ matchId, accept }) => ({ url: `/campaigns/matches/${matchId}/respond`, method: 'POST', body: { accept } }),
      invalidatesTags: ['Campaigns'],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetMyCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignStatusMutation,
  useRespondToMatchMutation,
} = campaignsApi;
