import { api } from '../api';
import type { ApiResponse } from '@/types';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminAgentTask {
  id: string;
  userId: string;
  agentType: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  tokensUsed: number;
  createdAt: string;
  completedAt: string | null;
  user?: { id: string; name: string; email: string; role: string };
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalTeams: number;
  totalPosts: number;
  totalAgentTasks: number;
  roles: Record<string, number>;
  recentUsers: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  inviteUrl?: string;
  invitedBy: { id: string; name: string; email: string };
  acceptedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface InviteValidation {
  email: string;
  role: string;
  invitedBy: { id: string; name: string; email: string };
  expiresAt: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminUsers: build.query<PaginatedResponse<AdminUser>, { page?: number; limit?: number; role?: string }>({
      query: ({ page = 1, limit = 20, role }) => ({
        url: '/users',
        params: { page, limit, ...(role ? { role } : {}) },
      }),
      providesTags: ['AdminUsers'],
    }),

    updateUserRole: build.mutation<ApiResponse<AdminUser>, { id: string; role: string }>({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    toggleUserActive: build.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({ url: `/users/${id}/toggle-active`, method: 'PATCH' }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    getAdminAgentHistory: build.query<PaginatedResponse<AdminAgentTask>, { page?: number; limit?: number; agentType?: string; userId?: string }>({
      query: ({ page = 1, limit = 20, agentType, userId }) => ({
        url: '/agents/admin/history',
        params: { page, limit, ...(agentType ? { agentType } : {}), ...(userId ? { userId } : {}) },
      }),
      providesTags: ['AdminAgents'],
    }),

    getSystemStats: build.query<ApiResponse<SystemStats>, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),

    // ── Invites ──
    createInvite: build.mutation<ApiResponse<Invite>, { email: string; role: string }>({
      query: (body) => ({ url: '/admin/invites', method: 'POST', body }),
      invalidatesTags: ['AdminInvites', 'AdminStats'],
    }),

    getInvites: build.query<PaginatedResponse<Invite>, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 20, status }) => ({
        url: '/admin/invites',
        params: { page, limit, ...(status ? { status } : {}) },
      }),
      providesTags: ['AdminInvites'],
    }),

    revokeInvite: build.mutation<ApiResponse<Invite>, string>({
      query: (id) => ({ url: `/admin/invites/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminInvites'],
    }),

    validateInvite: build.query<ApiResponse<InviteValidation>, string>({
      query: (token) => `/admin/invites/validate/${token}`,
    }),

    acceptInvite: build.mutation<ApiResponse<{ id: string; email: string; name: string; role: string }>, { token: string; name: string; password: string }>({
      query: ({ token, ...body }) => ({ url: `/admin/invites/accept/${token}`, method: 'POST', body }),
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useGetAdminAgentHistoryQuery,
  useGetSystemStatsQuery,
  useCreateInviteMutation,
  useGetInvitesQuery,
  useRevokeInviteMutation,
  useValidateInviteQuery,
  useAcceptInviteMutation,
} = adminApi;

export type { AdminUser, AdminAgentTask, SystemStats, Invite, InviteValidation };
