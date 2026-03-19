import { api } from '../api';
import type { Campaign, CampaignMatch, CampaignDeliverable, CampaignReportItem, ApiResponse } from '@/types';

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
    updateCampaign: build.mutation<ApiResponse<Campaign>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/campaigns/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Campaigns'],
    }),
    updateCampaignStatus: build.mutation<ApiResponse<Campaign>, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/campaigns/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Campaigns'],
    }),
    updateCampaignStage: build.mutation<ApiResponse<Campaign>, { id: string; stage: string }>({
      query: ({ id, stage }) => ({ url: `/campaigns/${id}/stage`, method: 'PATCH', body: { stage } }),
      invalidatesTags: ['Campaigns'],
    }),
    respondToMatch: build.mutation<ApiResponse<CampaignMatch>, { matchId: string; accept: boolean }>({
      query: ({ matchId, accept }) => ({ url: `/campaigns/matches/${matchId}/respond`, method: 'POST', body: { accept } }),
      invalidatesTags: ['Campaigns'],
    }),

    // ─── Deliverables ────────────────────────────────────────
    getDeliverables: build.query<ApiResponse<CampaignDeliverable[]>, string>({
      query: (campaignId) => `/campaigns/${campaignId}/deliverables`,
      providesTags: ['Campaigns'],
    }),
    createDeliverable: build.mutation<ApiResponse<CampaignDeliverable>, { campaignId: string; data: Record<string, unknown> }>({
      query: ({ campaignId, data }) => ({ url: `/campaigns/${campaignId}/deliverables`, method: 'POST', body: data }),
      invalidatesTags: ['Campaigns'],
    }),
    updateDeliverable: build.mutation<ApiResponse<CampaignDeliverable>, { campaignId: string; deliverableId: string; data: Record<string, unknown> }>({
      query: ({ campaignId, deliverableId, data }) => ({ url: `/campaigns/${campaignId}/deliverables/${deliverableId}`, method: 'PUT', body: data }),
      invalidatesTags: ['Campaigns'],
    }),
    deleteDeliverable: build.mutation<ApiResponse<void>, { campaignId: string; deliverableId: string }>({
      query: ({ campaignId, deliverableId }) => ({ url: `/campaigns/${campaignId}/deliverables/${deliverableId}`, method: 'DELETE' }),
      invalidatesTags: ['Campaigns'],
    }),

    // ─── Reports ─────────────────────────────────────────────
    getCampaignReports: build.query<ApiResponse<CampaignReportItem[]>, string>({
      query: (campaignId) => `/campaigns/${campaignId}/reports`,
      providesTags: ['Campaigns'],
    }),

    // ─── Discovery ───────────────────────────────────────────
    discoverCreators: build.query<ApiResponse<unknown[]> & { pagination?: { total: number } }, Record<string, unknown>>({
      query: (params) => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) { if (v !== undefined && v !== '') qs.set(k, String(v)); }
        return `/campaigns/discover?${qs.toString()}`;
      },
      providesTags: ['Campaigns'],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetMyCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useUpdateCampaignStatusMutation,
  useUpdateCampaignStageMutation,
  useRespondToMatchMutation,
  useGetDeliverablesQuery,
  useCreateDeliverableMutation,
  useUpdateDeliverableMutation,
  useDeleteDeliverableMutation,
  useGetCampaignReportsQuery,
  useLazyDiscoverCreatorsQuery,
  useDiscoverCreatorsQuery,
} = campaignsApi;
