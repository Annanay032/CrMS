import { api } from '../api';
import type { User, AuthResponse, ApiResponse, CreatorProfile, BrandProfile } from '@/types';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthResponse>, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<ApiResponse<AuthResponse>, { name: string; email: string; password: string; role: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: build.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    logoutApi: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    updateProfile: build.mutation<ApiResponse<User>, { name: string }>({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    setupCreatorProfile: build.mutation<ApiResponse<CreatorProfile>, { bio?: string; niche: string[]; location?: string; languages?: string[]; portfolioUrl?: string }>({
      query: (body) => ({ url: '/users/creator-profile', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    setupBrandProfile: build.mutation<ApiResponse<BrandProfile>, { companyName: string; industry?: string; website?: string; budgetRangeLow?: number; budgetRangeHigh?: number }>({
      query: (body) => ({ url: '/users/brand-profile', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useLogoutApiMutation,
  useUpdateProfileMutation,
  useSetupCreatorProfileMutation,
  useSetupBrandProfileMutation,
} = authApi;
