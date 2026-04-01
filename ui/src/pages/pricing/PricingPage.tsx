import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/store';
import { TIER_CONFIG, PLAN_FEATURES } from '@/constants/features';
import {
  useCreateCheckoutMutation,
  useGetCheckoutConfigQuery,
  useGetSubscriptionQuery,
  useVerifyRazorpayPaymentMutation,
} from '@/store/endpoints/subscription';
import type { UsageTier } from '@/types';

type BillingCycle = 'monthly' | 'yearly';
type Currency = 'INR' | 'USD';

const TIERS: UsageTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
const CATEGORIES = [...new Set(PLAN_FEATURES.map((f) => f.category))];

function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return currency === 'INR' ? '₹0' : '$0';
  return currency === 'INR'
    ? `₹${amount.toLocaleString('en-IN')}`
    : `$${amount}`;
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string')
    return <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{value}</span>;
  return value ? (
    <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>
  ) : (
    <span style={{ color: '#475569', fontSize: 18 }}>—</span>
  );
}

/* ── Toggle Pill ─────────────────────────────────────────── */

function TogglePill<T extends string>({
  options,
  value,
  onChange,
  badge,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  badge?: Partial<Record<T, string>>;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 99,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '8px 20px',
              borderRadius: 99,
              border: 'none',
              background: active ? '#fff' : 'transparent',
              color: active ? '#0f172a' : '#94a3b8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {opt.label}
            {badge?.[opt.value] && (
              <span
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 99,
                }}
              >
                {badge[opt.value]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open(): void } }
}

function loadRazorpayScript(): Promise<void> {
  if (document.getElementById('razorpay-sdk')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = 'razorpay-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(s);
  });
}

export default function PricingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [checkoutLoading, setCheckoutLoading] = useState<UsageTier | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createCheckout] = useCreateCheckoutMutation();
  const [verifyRazorpay] = useVerifyRazorpayPaymentMutation();
  const { data: configRes } = useGetCheckoutConfigQuery(undefined, { skip: !isAuthenticated });
  const { data: subRes } = useGetSubscriptionQuery(undefined, { skip: !isAuthenticated });

  const currentTier = subRes?.data?.tier ?? 'FREE';
  const config = configRes?.data;

  function getPrice(tier: UsageTier): number {
    const cfg = TIER_CONFIG[tier];
    if (cycle === 'monthly') return currency === 'INR' ? cfg.monthlyPriceINR : cfg.monthlyPriceUSD;
    return currency === 'INR' ? cfg.yearlyPriceINR : cfg.yearlyPriceUSD;
  }

  function getPriceLabel(tier: UsageTier): string {
    const amount = getPrice(tier);
    if (amount === 0) return 'Free';
    return formatPrice(amount, currency);
  }

  function getPricePeriod(): string {
    return cycle === 'monthly' ? '/mo' : '/yr';
  }

  function getMonthlyEquivalent(tier: UsageTier): string | null {
    if (cycle !== 'yearly' || getPrice(tier) === 0) return null;
    const yearly = getPrice(tier);
    const monthly = Math.round(yearly / 12);
    return `${formatPrice(monthly, currency)}/mo`;
  }

  async function handleSelectPlan(tier: UsageTier) {
    // Not logged in → register
    if (!isAuthenticated) {
      navigate(tier === 'FREE' ? '/register' : `/register?plan=${tier.toLowerCase()}`);
      return;
    }

    // Already on this tier or higher → go to dashboard
    const tierRank: Record<UsageTier, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
    if (tierRank[tier] <= tierRank[currentTier]) {
      navigate('/settings?tab=plan');
      return;
    }

    // FREE tier for logged-in user → go to dashboard
    if (tier === 'FREE') {
      navigate('/dashboard');
      return;
    }

    setErrorMsg(null);
    setCheckoutLoading(tier);

    try {
      const provider = currency === 'INR' ? 'razorpay' : 'stripe';
      const billingCycle = cycle === 'monthly' ? 'MONTHLY' : 'YEARLY';

      const result = await createCheckout({
        tier,
        billingCycle,
        currency,
        provider,
      }).unwrap();

      if (provider === 'stripe' && result.data?.url) {
        // Stripe: redirect to hosted checkout page
        window.location.href = result.data.url;
      } else if (provider === 'razorpay' && result.data?.subscriptionId) {
        // Razorpay: open inline checkout modal
        await launchRazorpayCheckout(result.data.subscriptionId);
      } else {
        setErrorMsg('Could not start checkout. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'data' in err
        ? ((err as { data?: { message?: string } }).data?.message ?? 'Checkout failed')
        : 'Checkout failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function launchRazorpayCheckout(subscriptionId: string) {
    if (!config?.razorpayKeyId) {
      setErrorMsg('Razorpay is not configured. Please use USD for Stripe checkout.');
      return;
    }

    await loadRazorpayScript();

    return new Promise<void>((resolve) => {
      const options: Record<string, unknown> = {
        key: config.razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'CrMS',
        description: `${cycle === 'monthly' ? 'Monthly' : 'Yearly'} subscription`,
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            await verifyRazorpay(response).unwrap();
            navigate('/settings?tab=plan&checkout=success');
          } catch {
            setErrorMsg('Payment verification failed. Contact support if charged.');
          }
          resolve();
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(null);
            resolve();
          },
        },
        theme: { color: '#4f46e5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  function getCtaLabel(tier: UsageTier): string {
    if (!isAuthenticated) {
      return tier === 'FREE' ? 'Get Started Free' : 'Start 14-day free trial';
    }
    const tierRank: Record<UsageTier, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
    if (tier === currentTier) return 'Current Plan';
    if (tierRank[tier] < tierRank[currentTier]) return 'Current Plan';
    if (tier === 'ENTERPRISE') return 'Upgrade to Enterprise';
    return 'Upgrade to Pro';
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)',
          padding: '64px 24px 56px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 12, maxWidth: 560, marginInline: 'auto' }}>
          Start free, upgrade as you grow. Every plan includes the core CrMS experience.
        </p>

        {/* Toggles */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
          <TogglePill
            options={[
              { label: 'Monthly', value: 'monthly' as BillingCycle },
              { label: 'Yearly', value: 'yearly' as BillingCycle },
            ]}
            value={cycle}
            onChange={setCycle}
            badge={{ yearly: 'Save ~17%' }}
          />
          <TogglePill
            options={[
              { label: '$ USD', value: 'USD' as Currency },
              { label: '₹ INR', value: 'INR' as Currency },
            ]}
            value={currency}
            onChange={setCurrency}
          />
        </div>
      </div>

      {/* Pricing Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          maxWidth: 960,
          margin: '-32px auto 0',
          padding: '0 24px 48px',
        }}
      >
        {TIERS.map((tier) => {
          const cfg = TIER_CONFIG[tier];
          const isPopular = tier === 'PRO';
          const monthlyEq = getMonthlyEquivalent(tier);

          return (
            <div
              key={tier}
              style={{
                background: '#1e293b',
                borderRadius: 16,
                padding: 32,
                border: isPopular ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: cfg.color,
                    color: '#fff',
                    padding: '4px 16px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                {/* Tier badge */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 99,
                    background: `${cfg.color}22`,
                    color: cfg.color,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  {cfg.label}
                </div>

                {/* Price */}
                <div style={{ fontSize: 40, fontWeight: 700, color: '#fff' }}>
                  {getPriceLabel(tier)}
                  {getPrice(tier) > 0 && (
                    <span style={{ fontSize: 16, fontWeight: 400, color: '#94a3b8' }}> {getPricePeriod()}</span>
                  )}
                </div>

                {/* Yearly equivalent */}
                {monthlyEq && (
                  <div style={{ fontSize: 13, color: '#22c55e', marginTop: 4 }}>
                    That&apos;s just {monthlyEq}
                  </div>
                )}

                {/* Key limits summary */}
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>
                  {typeof cfg.channels === 'number' ? cfg.channels : '∞'} channels
                  {' · '}
                  {typeof cfg.scheduledPostsPerChannel === 'number' ? cfg.scheduledPostsPerChannel : '∞'} posts/channel
                  <br />
                  {cfg.aiTokensPerDay.toLocaleString()} AI tokens/day
                  {' · '}
                  {cfg.teamMembers === 'Unlimited' ? '∞' : cfg.teamMembers} team
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => handleSelectPlan(tier)}
                disabled={checkoutLoading !== null}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    (isAuthenticated && tier === currentTier) || (isAuthenticated && tier === 'FREE' && currentTier !== 'FREE')
                      ? 'rgba(255,255,255,0.06)'
                      : isPopular
                        ? cfg.color
                        : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor:
                    (isAuthenticated && tier === currentTier) || checkoutLoading !== null
                      ? 'default'
                      : 'pointer',
                  marginBottom: 8,
                  transition: 'opacity 150ms',
                  opacity: checkoutLoading === tier ? 0.6 : 1,
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = checkoutLoading ? '1' : '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {checkoutLoading === tier ? 'Processing...' : getCtaLabel(tier)}
              </button>
              {tier !== 'FREE' && !isAuthenticated && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  No credit card required
                </div>
              )}
              {tier !== 'FREE' && isAuthenticated && tier !== currentTier && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  14-day free trial · Cancel anytime
                </div>
              )}

              {/* Feature list (compact on card) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                {CATEGORIES.slice(0, 4).map((cat) => {
                  const features = PLAN_FEATURES.filter((f) => f.category === cat);
                  const tierKey = tier.toLowerCase() as 'free' | 'pro' | 'enterprise';
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 6,
                        }}
                      >
                        {cat}
                      </div>
                      {features.map((f) => (
                        <div
                          key={f.name}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '5px 0',
                            fontSize: 13,
                            color: '#cbd5e1',
                          }}
                        >
                          <span>{f.name}</span>
                          <FeatureValue value={f[tierKey]} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 24px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '12px 20px',
              color: '#fca5a5',
              fontSize: 14,
            }}
          >
            {errorMsg}
          </div>
        </div>
      )}

      {/* Full Feature Comparison Table */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Compare all features
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            {/* Table header */}
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontWeight: 500 }}>
                  Feature
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier}
                    style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      color: TIER_CONFIG[tier].color,
                      fontWeight: 600,
                      minWidth: 120,
                    }}
                  >
                    {TIER_CONFIG[tier].label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {CATEGORIES.map((cat) => {
                const features = PLAN_FEATURES.filter((f) => f.category === cat);
                return (
                  <>
                    {/* Category header row */}
                    <tr key={`cat-${cat}`}>
                      <td
                        colSpan={4}
                        style={{
                          padding: '16px 16px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#f59e0b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {cat}
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {features.map((f) => (
                      <tr
                        key={f.name}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>{f.name}</td>
                        {(['free', 'pro', 'enterprise'] as const).map((tierKey) => (
                          <td key={tierKey} style={{ textAlign: 'center', padding: '10px 16px' }}>
                            <FeatureValue value={f[tierKey]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ teaser + Back link */}
      <div style={{ textAlign: 'center', paddingBottom: 48 }}>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
          Questions? We&apos;re here to help.
        </p>
        <button
          onClick={() => navigate(isAuthenticated ? '/settings' : '/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            fontSize: 14,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isAuthenticated ? '← Back to Settings' : '← Back to login'}
        </button>
      </div>
    </div>
  );
}
