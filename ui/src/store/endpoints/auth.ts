import { api } from '../api';
import type { User, AuthResponse, ApiResponse, CreatorProfile, BrandProfile, UserTeam } from '@/types';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthResponse>, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<ApiResponse<AuthResponse>, { name: string; email: string; password: string; role: string; inviteCode?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: build.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    getMyTeams: build.query<ApiResponse<UserTeam[]>, void>({
      query: () => '/auth/my-teams',
      providesTags: ['Teams'],
    }),
    logoutApi: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    forgotPassword: build.mutation<ApiResponse<{ message: string }>, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    updateProfile: build.mutation<ApiResponse<User>, { name: string }>({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    setPassword: build.mutation<ApiResponse<{ message: string }>, { password: string }>({
      query: (body) => ({ url: '/auth/set-password', method: 'PUT', body }),
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
  useGetMyTeamsQuery,
  useLogoutApiMutation,
  useForgotPasswordMutation,
  useUpdateProfileMutation,
  useSetPasswordMutation,
  useSetupCreatorProfileMutation,
  useSetupBrandProfileMutation,
} = authApi;
