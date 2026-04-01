import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const teamId = localStorage.getItem('activeTeamId');
    if (teamId) headers.set('X-Team-Id', teamId);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiArg,
  extraOptions,
) => {
  let result = await baseQuery(args, apiArg, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        apiArg,
        extraOptions,
      );
      if (refreshResult.data) {
        const data = refreshResult.data as { data: { accessToken: string; refreshToken: string } };
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        result = await baseQuery(args, apiArg, extraOptions);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Campaigns', 'Content', 'Agents', 'Matching', 'Analytics', 'Users', 'Accounts', 'Ideas', 'Tags', 'Templates', 'IdeaStages', 'Listening', 'Competitive', 'Community', 'Reports', 'Teams', 'StartPages', 'Notifications', 'Usage', 'Settings', 'Media', 'Revenue', 'Growth', 'Studio', 'Subscription', 'AdminUsers', 'AdminAgents', 'AdminStats', 'AdminInvites', 'CRM', 'Signals', 'Contracts'],
  endpoints: () => ({}),
});
