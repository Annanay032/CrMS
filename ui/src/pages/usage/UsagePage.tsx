import { Card, Progress, Tag, Typography, Table, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGauge, faBolt, faChartColumn } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/common';
import { useGetUsageSummaryQuery, useGetUsageHistoryQuery } from '@/store/endpoints/usage';
import type { UsageTier } from '@/types';

const { Text, Title } = Typography;

const TIER_COLORS: Record<UsageTier, string> = { FREE: 'blue', PRO: 'gold', ENTERPRISE: 'purple' };

export function UsagePage() {
  const { data: summaryRes } = useGetUsageSummaryQuery();
  const { data: historyRes } = useGetUsageHistoryQuery({ days: 30 });
  const summary = summaryRes?.data;
  const history = historyRes?.data ?? [];
  const pct = summary ? Math.round((summary.usedToday / summary.dailyLimit) * 100) : 0;

  const columns = [
    { title: 'Agent', dataIndex: 'agentType', key: 'agentType', render: (v: string) => v.replace(/_/g, ' ') },
    { title: 'Tokens', dataIndex: 'tokensUsed', key: 'tokensUsed', render: (v: number) => v.toLocaleString() },
    { title: 'Calls', dataIndex: 'calls', key: 'calls' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader icon={faGauge} title="AI Usage & Budget" />

      {/* Today's usage card */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: 8 }} />
              Today&apos;s Usage
            </Title>
            <Text type="secondary">
              {summary?.usedToday.toLocaleString() ?? 0} / {summary?.dailyLimit.toLocaleString() ?? 0} tokens
            </Text>
          </div>
          <Tag color={TIER_COLORS[summary?.tier ?? 'FREE']}>
            {summary?.tier ?? 'FREE'}
          </Tag>
        </div>
        <Progress
          percent={pct}
          status={pct >= 90 ? 'exception' : 'active'}
          strokeColor={pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#1677ff'}
        />
      </Card>

      {/* Per-agent breakdown */}
      <Card title="Agent Breakdown (Today)" style={{ marginBottom: 24 }}>
        {summary?.breakdown && summary.breakdown.length > 0 ? (
          <Table dataSource={summary.breakdown} columns={columns} rowKey="agentType" pagination={false} size="small" />
        ) : (
          <Empty description="No agent calls today" />
        )}
      </Card>

      {/* 30-day history chart */}
      <Card title={<><FontAwesomeIcon icon={faChartColumn} style={{ marginRight: 8 }} />30-Day History</>}>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tokens" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No usage history yet" />
        )}
      </Card>
    </div>
  );
}
