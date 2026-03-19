import { Card, Typography, Progress, Tag, Button, Alert } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { useGetUsageSummaryQuery } from '@/store/endpoints/usage';
import { useGetSubscriptionQuery } from '@/store/endpoints/subscription';
import { TIER_CONFIG, PLAN_FEATURES } from '@/constants/features';
import type { UsageTier } from '@/types';

const { Text, Title } = Typography;
const TIER_TAG_COLOR: Record<UsageTier, string> = { FREE: 'blue', PRO: 'gold', ENTERPRISE: 'purple' };

export function PlanCard() {
  const { data: summaryRes } = useGetUsageSummaryQuery();
  const { data: subRes } = useGetSubscriptionQuery();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const checkoutSuccess = searchParams.get('checkout') === 'success';

  const sub = subRes?.data;
  const tier: UsageTier = sub?.tier ?? 'FREE';
  const cfg = TIER_CONFIG[tier];
  const summary = summaryRes?.data;
  const pct = summary ? Math.round((summary.usedToday / summary.dailyLimit) * 100) : 0;

  const tierKey = tier.toLowerCase() as 'free' | 'pro' | 'enterprise';
  const highlights = PLAN_FEATURES.filter((f) => f[tierKey] === true || typeof f[tierKey] === 'string')
    .slice(0, 6);

  function formatPlanPrice(): string {
    if (!sub || tier === 'FREE') return '₹0 forever';
    const prices = TIER_CONFIG[tier];
    if (sub.currency === 'INR') {
      const amount = sub.billingCycle === 'YEARLY' ? prices.yearlyPriceINR : prices.monthlyPriceINR;
      return `₹${amount.toLocaleString('en-IN')}/${sub.billingCycle === 'YEARLY' ? 'yr' : 'mo'}`;
    }
    const amount = sub.billingCycle === 'YEARLY' ? prices.yearlyPriceUSD : prices.monthlyPriceUSD;
    return `$${amount}/${sub.billingCycle === 'YEARLY' ? 'yr' : 'mo'}`;
  }

  return (
    <Card style={{ marginTop: 24 }}>
      {checkoutSuccess && (
        <Alert
          type="success"
          message="Payment successful! Your plan has been upgraded."
          showIcon
          closable
          onClose={() => {
            searchParams.delete('checkout');
            setSearchParams(searchParams);
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faCrown} style={{ marginRight: 8, color: cfg.color }} />
            Your Plan
          </Title>
          <div style={{ marginTop: 4 }}>
            <Tag color={TIER_TAG_COLOR[tier]}>{cfg.label}</Tag>
            <Text type="secondary">{formatPlanPrice()}</Text>
          </div>
          {sub?.status === 'TRIALING' && sub.trialDaysRemaining > 0 && (
            <div style={{ marginTop: 4 }}>
              <Tag color="orange">{sub.trialDaysRemaining} days left in trial</Tag>
            </div>
          )}
          {sub?.cancelAtPeriodEnd && (
            <div style={{ marginTop: 4 }}>
              <Tag color="red">Cancels at period end</Tag>
            </div>
          )}
          {sub?.currentPeriodEnd && sub.status === 'ACTIVE' && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
            </Text>
          )}
        </div>
        {tier !== 'ENTERPRISE' && (
          <Button type="primary" onClick={() => navigate('/pricing')}>
            Upgrade
          </Button>
        )}
      </div>

      {summary && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            AI tokens today: {summary.usedToday.toLocaleString()} / {summary.dailyLimit.toLocaleString()}
          </Text>
          <Progress
            percent={pct}
            size="small"
            status={pct >= 90 ? 'exception' : 'active'}
            strokeColor={pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#1677ff'}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        {highlights.map((f) => (
          <Text key={f.name} style={{ fontSize: 12 }}>
            <span style={{ color: '#22c55e', marginRight: 6 }}>✓</span>
            {f.name}
            {typeof f[tierKey] === 'string' ? ` (${f[tierKey]})` : ''}
          </Text>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Button type="link" size="small" onClick={() => navigate('/pricing')} style={{ padding: 0 }}>
          Compare all plans →
        </Button>
      </div>
    </Card>
  );
}
