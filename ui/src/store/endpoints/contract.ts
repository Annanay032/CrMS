import { api } from '../api';
import type { ApiResponse } from '@/types';

export interface ContractDeliverable {
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface PaymentMilestone {
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface Contract {
  id: string;
  creatorProfileId: string;
  brandDealId?: string;
  title: string;
  terms?: string;
  deliverables: ContractDeliverable[];
  paymentSchedule: PaymentMilestone[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  totalValue: number;
  notes?: string;
  brandDeal?: { brandName: string; dealValue: number; status: string };
  createdAt: string;
  updatedAt: string;
}

export interface ContractCalendarEvent {
  id: string;
  contractId: string;
  title: string;
  type: 'deliverable' | 'payment';
  dueDate: string;
  completed: boolean;
  brandName?: string;
}

export const contractApi = api.injectEndpoints({
  endpoints: (build) => ({
    listContracts: build.query<ApiResponse<Contract[]> & { pagination?: unknown }, { page?: number; status?: string }>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
        return `/contracts?${qs}`;
      },
      providesTags: ['Contracts'],
    }),
    getContract: build.query<ApiResponse<Contract>, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: ['Contracts'],
    }),
    createContract: build.mutation<ApiResponse<Contract>, Partial<Contract>>({
      query: (body) => ({ url: '/contracts', method: 'POST', body }),
      invalidatesTags: ['Contracts'],
    }),
    updateContract: build.mutation<ApiResponse<Contract>, { id: string } & Partial<Contract>>({
      query: ({ id, ...body }) => ({ url: `/contracts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Contracts'],
    }),
    deleteContract: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/contracts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contracts'],
    }),
    getContractCalendarEvents: build.query<ApiResponse<ContractCalendarEvent[]>, void>({
      query: () => '/contracts/calendar-events',
      providesTags: ['Contracts'],
    }),
  }),
});

export const {
  useListContractsQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
  useGetContractCalendarEventsQuery,
} = contractApi;
