import { api } from '../api';
import type { Team, TeamMember, ApprovalWorkflow, PostComment, ContentPost, ApiResponse } from '@/types';

export const teamApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ─── Team CRUD ───────────────────────────────────────────
    getMyTeams: build.query<ApiResponse<Team[]>, void>({
      query: () => '/teams',
      providesTags: ['Teams'],
    }),
    getTeam: build.query<ApiResponse<Team>, string>({
      query: (id) => `/teams/${id}`,
      providesTags: ['Teams'],
    }),
    createTeam: build.mutation<ApiResponse<Team>, { name: string; avatarUrl?: string }>({
      query: (body) => ({ url: '/teams', method: 'POST', body }),
      invalidatesTags: ['Teams'],
    }),
    updateTeam: build.mutation<ApiResponse<Team>, { id: string; data: { name?: string; avatarUrl?: string } }>({
      query: ({ id, data }) => ({ url: `/teams/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Teams'],
    }),
    deleteTeam: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/teams/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Teams'],
    }),

    // ─── Members ─────────────────────────────────────────────
    addTeamMember: build.mutation<ApiResponse<TeamMember>, { teamId: string; email: string; role: string }>({
      query: ({ teamId, ...body }) => ({ url: `/teams/${teamId}/members`, method: 'POST', body }),
      invalidatesTags: ['Teams'],
    }),
    updateMemberRole: build.mutation<ApiResponse<TeamMember>, { teamId: string; memberId: string; role: string }>({
      query: ({ teamId, memberId, role }) => ({ url: `/teams/${teamId}/members/${memberId}`, method: 'PUT', body: { role } }),
      invalidatesTags: ['Teams'],
    }),
    removeMember: build.mutation<ApiResponse<void>, { teamId: string; memberId: string }>({
      query: ({ teamId, memberId }) => ({ url: `/teams/${teamId}/members/${memberId}`, method: 'DELETE' }),
      invalidatesTags: ['Teams'],
    }),

    // ─── Workflows ───────────────────────────────────────────
    getWorkflows: build.query<ApiResponse<ApprovalWorkflow[]>, string>({
      query: (teamId) => `/teams/${teamId}/workflows`,
      providesTags: ['Teams'],
    }),
    createWorkflow: build.mutation<ApiResponse<ApprovalWorkflow>, { teamId: string; name: string; stages: Array<{ name: string; approverRoles: string[] }>; isDefault?: boolean }>({
      query: ({ teamId, ...body }) => ({ url: `/teams/${teamId}/workflows`, method: 'POST', body }),
      invalidatesTags: ['Teams'],
    }),
    updateWorkflow: build.mutation<ApiResponse<ApprovalWorkflow>, { teamId: string; workflowId: string; data: Record<string, unknown> }>({
      query: ({ teamId, workflowId, data }) => ({ url: `/teams/${teamId}/workflows/${workflowId}`, method: 'PUT', body: data }),
      invalidatesTags: ['Teams'],
    }),
    deleteWorkflow: build.mutation<ApiResponse<void>, { teamId: string; workflowId: string }>({
      query: ({ teamId, workflowId }) => ({ url: `/teams/${teamId}/workflows/${workflowId}`, method: 'DELETE' }),
      invalidatesTags: ['Teams'],
    }),

    // ─── Team Calendar ───────────────────────────────────────
    getTeamCalendar: build.query<ApiResponse<ContentPost[]>, { teamId: string; month: number; year: number }>({
      query: ({ teamId, month, year }) => `/teams/${teamId}/calendar?month=${month}&year=${year}`,
      providesTags: ['Teams', 'Content'],
    }),

    // ─── Approval Actions ────────────────────────────────────
    submitForApproval: build.mutation<ApiResponse<ContentPost>, { postId: string; teamId: string }>({
      query: ({ postId, teamId }) => ({ url: `/teams/posts/${postId}/submit`, method: 'POST', body: { teamId } }),
      invalidatesTags: ['Content', 'Teams'],
    }),
    approvePost: build.mutation<ApiResponse<ContentPost>, { postId: string; comment?: string }>({
      query: ({ postId, comment }) => ({ url: `/teams/posts/${postId}/approve`, method: 'POST', body: { comment } }),
      invalidatesTags: ['Content', 'Teams'],
    }),
    requestPostChanges: build.mutation<ApiResponse<ContentPost>, { postId: string; comment?: string }>({
      query: ({ postId, comment }) => ({ url: `/teams/posts/${postId}/request-changes`, method: 'POST', body: { comment } }),
      invalidatesTags: ['Content', 'Teams'],
    }),
    rejectPost: build.mutation<ApiResponse<ContentPost>, { postId: string; comment?: string }>({
      query: ({ postId, comment }) => ({ url: `/teams/posts/${postId}/reject`, method: 'POST', body: { comment } }),
      invalidatesTags: ['Content', 'Teams'],
    }),

    // ─── Post Comments ───────────────────────────────────────
    getPostComments: build.query<ApiResponse<PostComment[]>, string>({
      query: (postId) => `/teams/posts/${postId}/comments`,
      providesTags: ['Teams'],
    }),
    addPostComment: build.mutation<ApiResponse<PostComment>, { postId: string; body: string }>({
      query: ({ postId, body }) => ({ url: `/teams/posts/${postId}/comments`, method: 'POST', body: { body } }),
      invalidatesTags: ['Teams'],
    }),
  }),
});

export const {
  useGetMyTeamsQuery,
  useGetTeamQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetTeamCalendarQuery,
  useSubmitForApprovalMutation,
  useApprovePostMutation,
  useRequestPostChangesMutation,
  useRejectPostMutation,
  useGetPostCommentsQuery,
  useAddPostCommentMutation,
} = teamApi;
