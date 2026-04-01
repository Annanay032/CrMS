import { api } from '../api';
import type { ApiResponse, Contact, PipelineData, Signal, SignalSummary, ContactType, ContactSource, SignalType, SignalStatus } from '@/types';

interface ListContactsParams {
  page?: number;
  limit?: number;
  type?: ContactType;
  source?: ContactSource;
  platform?: string;
  search?: string;
  minScore?: number;
}

interface ListSignalsParams {
  page?: number;
  limit?: number;
  type?: SignalType;
  status?: SignalStatus;
  minScore?: number;
}

export const crmApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Contacts
    listContacts: build.query<ApiResponse<Contact[]> & { pagination?: unknown }, ListContactsParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
        return `/crm/contacts?${qs}`;
      },
      providesTags: ['CRM'],
    }),
    getContact: build.query<ApiResponse<Contact>, string>({
      query: (id) => `/crm/contacts/${id}`,
      providesTags: ['CRM'],
    }),
    createContact: build.mutation<ApiResponse<Contact>, Partial<Contact>>({
      query: (body) => ({ url: '/crm/contacts', method: 'POST', body }),
      invalidatesTags: ['CRM'],
    }),
    updateContact: build.mutation<ApiResponse<Contact>, { id: string } & Partial<Contact>>({
      query: ({ id, ...body }) => ({ url: `/crm/contacts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['CRM'],
    }),
    deleteContact: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/crm/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CRM'],
    }),
    updateContactTags: build.mutation<ApiResponse<Contact>, { id: string; tags: string[] }>({
      query: ({ id, tags }) => ({ url: `/crm/contacts/${id}/tags`, method: 'PATCH', body: { tags } }),
      invalidatesTags: ['CRM'],
    }),

    // Pipeline
    getPipeline: build.query<ApiResponse<PipelineData>, void>({
      query: () => '/crm/pipeline',
      providesTags: ['CRM', 'Revenue'],
    }),

    // Signals
    listSignals: build.query<ApiResponse<Signal[]> & { pagination?: unknown }, ListSignalsParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
        return `/crm/signals?${qs}`;
      },
      providesTags: ['Signals'],
    }),
    getSignalSummary: build.query<ApiResponse<SignalSummary>, void>({
      query: () => '/crm/signals/summary',
      providesTags: ['Signals'],
    }),
    updateSignalStatus: build.mutation<ApiResponse<Signal>, { id: string; status: SignalStatus }>({
      query: ({ id, status }) => ({ url: `/crm/signals/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Signals'],
    }),
  }),
});

export const {
  useListContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useUpdateContactTagsMutation,
  useGetPipelineQuery,
  useListSignalsQuery,
  useGetSignalSummaryQuery,
  useUpdateSignalStatusMutation,
} = crmApi;
