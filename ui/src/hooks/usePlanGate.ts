import { useGetSubscriptionQuery } from '@/store/endpoints/subscription';
import { tierMeetsMinimum } from '@/constants/features';
import type { UsageTier } from '@/types';

/**
 * Returns the user's current subscription info and a helper to check tier access.
 */
export function usePlanGate() {
  const { data: res, isLoading } = useGetSubscriptionQuery();
  const sub = res?.data;
  const currentTier: UsageTier = sub?.tier ?? 'FREE';

  function canAccess(minTier: UsageTier): boolean {
    return tierMeetsMinimum(currentTier, minTier);
  }

  return {
    currentTier,
    status: sub?.status ?? 'ACTIVE',
    trialDaysRemaining: sub?.trialDaysRemaining ?? 0,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    isLoading,
    canAccess,
  };
}
