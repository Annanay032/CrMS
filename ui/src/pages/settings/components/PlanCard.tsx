import { Card, Typography, Progress, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { useGetUsageSummaryQuery } from '@/store/endpoints/usage';
import { TIER_CONFIG, PLAN_FEATURES } from '@/constants/features';
import type { UsageTier } from '@/types';

const { Text, Title } = Typography;
const TIER_TAG_COLOR: Record<UsageTier, string> = { FREE: 'blue', PRO: 'gold', ENTERPRISE: 'purple' };

export function PlanCard() {
  const { data: summaryRes } = useGetUsageSummaryQuery();
  const navigate = useNavigate();

  const tier: UsageTier = summaryRes?.data?.tier ?? 'FREE';
  const cfg = TIER_CONFIG[tier];
  const summary = summaryRes?.data;
  const pct = summary ? Math.round((summary.usedToday / summary.dailyLimit) * 100) : 0;

  const tierKey = tier.toLowerCase() as 'free' | 'pro' | 'enterprise';
  const highlights = PLAN_FEATURES.filter((f) => f[tierKey] === true || typeof f[tierKey] === 'string')
    .slice(0, 6);

  return (
    <Card style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faCrown} style={{ marginRight: 8, color: cfg.color }} />
            Your Plan
          </Title>
          <div style={{ marginTop: 4 }}>
            <Tag color={TIER_TAG_COLOR[tier]}>{cfg.label}</Tag>
            <Text type="secondary">{cfg.price} {cfg.priceSubtext}</Text>
          </div>
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
