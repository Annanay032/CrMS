import { api } from '../api';
import type { ApiResponse, CreatorProfile } from '@/types';

export const matchingApi = api.injectEndpoints({
  endpoints: (build) => ({
    discoverCreators: build.query<ApiResponse<CreatorProfile[]> & { pagination?: { total: number } }, { niche?: string; platform?: string; minFollowers?: number; maxFollowers?: number; minEngagement?: number; page?: number }>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.niche) qs.set('niche', params.niche);
        if (params.platform) qs.set('platform', params.platform);
        if (params.minFollowers) qs.set('minFollowers', String(params.minFollowers));
        if (params.maxFollowers) qs.set('maxFollowers', String(params.maxFollowers));
        if (params.minEngagement) qs.set('minEngagement', String(params.minEngagement));
        if (params.page) qs.set('page', String(params.page));
        return `/matching/creators?${qs}`;
      },
      providesTags: ['Matching'],
    }),
    findCreators: build.mutation<ApiResponse<unknown>, { campaignId: string }>({
      query: (body) => ({ url: '/matching/find-creators', method: 'POST', body }),
      invalidatesTags: ['Matching'],
    }),
    getMatchResults: build.query<ApiResponse<unknown[]>, string>({
      query: (campaignId) => `/matching/campaigns/${campaignId}/matches`,
      providesTags: ['Matching'],
    }),
  }),
});

export const {
  useDiscoverCreatorsQuery,
  useLazyDiscoverCreatorsQuery,
  useFindCreatorsMutation,
  useGetMatchResultsQuery,
} = matchingApi;
