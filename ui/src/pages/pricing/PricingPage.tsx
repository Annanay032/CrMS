import { useNavigate } from 'react-router-dom';
import { TIER_CONFIG, PLAN_FEATURES } from '@/constants/features';
import type { UsageTier } from '@/types';

const TIERS: UsageTier[] = ['FREE', 'PRO', 'ENTERPRISE'];

const CATEGORIES = [...new Set(PLAN_FEATURES.map((f) => f.category))];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') return <span style={{ color: '#e2e8f0', fontSize: 13 }}>{value}</span>;
  return value ? (
    <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>
  ) : (
    <span style={{ color: '#475569', fontSize: 18 }}>—</span>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)',
          padding: '64px 24px 48px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 12, maxWidth: 560, marginInline: 'auto' }}>
          Start free, upgrade as you grow. Every plan includes the core CrMS experience.
        </p>
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
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
                <div style={{ fontSize: 40, fontWeight: 700, color: '#fff' }}>
                  {cfg.price}
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#94a3b8' }}> {cfg.priceSubtext}</span>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                  {cfg.aiTokensPerDay.toLocaleString()} AI tokens/day · {cfg.teamMembers === 'Unlimited' ? '∞' : cfg.teamMembers} team members
                </div>
              </div>

              <button
                onClick={() => navigate(tier === 'FREE' ? '/register' : tier === 'ENTERPRISE' ? '/register' : '/settings')}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: isPopular ? cfg.color : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 24,
                  transition: 'opacity 150ms',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {tier === 'FREE' ? 'Get Started Free' : tier === 'PRO' ? 'Upgrade to Pro' : 'Contact Sales'}
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                {CATEGORIES.map((cat) => {
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

      {/* Back link */}
      <div style={{ textAlign: 'center', paddingBottom: 48 }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            fontSize: 14,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
}
