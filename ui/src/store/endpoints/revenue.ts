import { api } from '../api';
import type { ApiResponse } from '@/types';

interface RevenueSummary {
  totalEarnings: number;
  byType: Record<string, number>;
  activeDealValue: number;
  pendingInvoiceAmount: number;
  overdueInvoiceAmount: number;
  totalDeals: number;
  totalInvoices: number;
}

interface RevenueStream {
  id: string;
  type: string;
  source: string;
  amount: number;
  currency: string;
  period?: string;
  receivedAt?: string;
  createdAt: string;
}

interface BrandDeal {
  id: string;
  brandName: string;
  contactEmail?: string;
  dealValue: number;
  currency: string;
  deliverables: string[];
  status: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  invoices: Invoice[];
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

interface PostROI {
  postId: string;
  title: string;
  platform: string;
  revenue: number;
  impressions: number;
  engagement: number;
  publishedAt: string;
}

export const revenueApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRevenueSummary: build.query<ApiResponse<RevenueSummary>, { period?: string }>({
      query: ({ period } = {}) => `/revenue/summary${period ? `?period=${period}` : ''}`,
      providesTags: ['Revenue'],
    }),
    getPostROI: build.query<ApiResponse<PostROI[]>, void>({
      query: () => '/revenue/post-roi',
      providesTags: ['Revenue'],
    }),

    // Revenue Streams
    listRevenueStreams: build.query<ApiResponse<RevenueStream[]> & { pagination?: unknown }, { page?: number; type?: string; period?: string }>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
        return `/revenue/streams?${qs}`;
      },
      providesTags: ['Revenue'],
    }),
    createRevenueStream: build.mutation<ApiResponse<RevenueStream>, Partial<RevenueStream>>({
      query: (body) => ({ url: '/revenue/streams', method: 'POST', body }),
      invalidatesTags: ['Revenue'],
    }),
    deleteRevenueStream: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/revenue/streams/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Revenue'],
    }),

    // Brand Deals
    listBrandDeals: build.query<ApiResponse<BrandDeal[]> & { pagination?: unknown }, { page?: number; status?: string }>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
        return `/revenue/deals?${qs}`;
      },
      providesTags: ['Revenue'],
    }),
    createBrandDeal: build.mutation<ApiResponse<BrandDeal>, Partial<BrandDeal>>({
      query: (body) => ({ url: '/revenue/deals', method: 'POST', body }),
      invalidatesTags: ['Revenue'],
    }),
    updateBrandDeal: build.mutation<ApiResponse<BrandDeal>, { id: string } & Partial<BrandDeal>>({
      query: ({ id, ...body }) => ({ url: `/revenue/deals/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Revenue'],
    }),
    deleteBrandDeal: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/revenue/deals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Revenue'],
    }),

    // Invoices
    listInvoices: build.query<ApiResponse<Invoice[]> & { pagination?: unknown }, { page?: number; status?: string }>({
      query: (params) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
        return `/revenue/invoices?${qs}`;
      },
      providesTags: ['Revenue'],
    }),
    createInvoice: build.mutation<ApiResponse<Invoice>, Partial<Invoice> & { brandDealId?: string }>({
      query: (body) => ({ url: '/revenue/invoices', method: 'POST', body }),
      invalidatesTags: ['Revenue'],
    }),
    updateInvoice: build.mutation<ApiResponse<Invoice>, { id: string } & Partial<Invoice>>({
      query: ({ id, ...body }) => ({ url: `/revenue/invoices/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Revenue'],
    }),
    deleteInvoice: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/revenue/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Revenue'],
    }),
  }),
});

export const {
  useGetRevenueSummaryQuery,
  useGetPostROIQuery,
  useListRevenueStreamsQuery,
  useCreateRevenueStreamMutation,
  useDeleteRevenueStreamMutation,
  useListBrandDealsQuery,
  useCreateBrandDealMutation,
  useUpdateBrandDealMutation,
  useDeleteBrandDealMutation,
  useListInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = revenueApi;
