import { api } from '../api';
import type { ApiResponse, UsageTier } from '@/types';

export interface SubscriptionData {
  id?: string;
  tier: UsageTier;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  trialDaysRemaining: number;
  cancelAtPeriodEnd: boolean;
  paymentProvider?: 'STRIPE' | 'RAZORPAY' | 'NONE';
  transactions: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  invoiceUrl?: string | null;
  createdAt: string;
}

export interface PlanPricing {
  tier: UsageTier;
  cycle: string;
  currency: string;
  amount: number;
}

export const subscriptionApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCheckoutConfig: build.query<ApiResponse<{ razorpayKeyId: string | null; stripePublishableKey: string | null }>, void>({
      query: () => '/subscriptions/config',
    }),

    getSubscription: build.query<ApiResponse<SubscriptionData>, void>({
      query: () => '/subscriptions',
      providesTags: ['Subscription'],
    }),

    getPricing: build.query<ApiResponse<PlanPricing>, { tier: string; cycle: string; currency: string }>({
      query: (params) => ({ url: '/subscriptions/pricing', params }),
    }),

    createCheckout: build.mutation<
      ApiResponse<{ sessionId?: string; url?: string; subscriptionId?: string; shortUrl?: string }>,
      { tier: string; billingCycle: string; currency: string; provider: 'stripe' | 'razorpay' }
    >({
      query: (body) => ({ url: '/subscriptions/checkout', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),

    changePlan: build.mutation<ApiResponse<unknown>, { tier: string; billingCycle: string }>({
      query: (body) => ({ url: '/subscriptions/change', method: 'PATCH', body }),
      invalidatesTags: ['Subscription', 'Usage'],
    }),

    cancelSubscription: build.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: '/subscriptions/cancel', method: 'POST' }),
      invalidatesTags: ['Subscription'],
    }),

    reactivateSubscription: build.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: '/subscriptions/reactivate', method: 'POST' }),
      invalidatesTags: ['Subscription'],
    }),

    getPaymentHistory: build.query<ApiResponse<PaymentTransaction[]>, void>({
      query: () => '/subscriptions/payments',
      providesTags: ['Subscription'],
    }),

    createPortalSession: build.mutation<ApiResponse<{ url: string }>, void>({
      query: () => ({ url: '/subscriptions/portal', method: 'POST' }),
    }),

    verifyRazorpayPayment: build.mutation<
      ApiResponse<unknown>,
      { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }
    >({
      query: (body) => ({ url: '/subscriptions/verify-razorpay', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetCheckoutConfigQuery,
  useGetSubscriptionQuery,
  useGetPricingQuery,
  useCreateCheckoutMutation,
  useChangePlanMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useGetPaymentHistoryQuery,
  useCreatePortalSessionMutation,
  useVerifyRazorpayPaymentMutation,
} = subscriptionApi;
