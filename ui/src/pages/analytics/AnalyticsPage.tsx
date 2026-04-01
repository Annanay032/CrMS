import { useState } from 'react';
import { Button, Tabs, Spin } from 'antd';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useGetAnalyticsDashboardQuery } from '@/store/endpoints/dashboard';
import { useGetAnalyticsInsightsMutation } from '@/store/endpoints/agents';
import { PageHeader } from '@/components/common';
import type { Period, AnalyticsTab } from './types';
import { PERIODS } from './constants';
import { OverviewTab } from './components/OverviewTab';
import { ContentPerformanceTab } from './components/ContentPerformanceTab';
import { AudienceTab } from './components/AudienceTab';
import { ReportsTab } from './components/ReportsTab';
import { PostAnalyticsTab } from './components/PostAnalyticsTab';

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const { data, isLoading } = useGetAnalyticsDashboardQuery({ period });
  const [getInsights, { isLoading: aiLoading }] = useGetAnalyticsInsightsMutation();
  const [aiInsights, setAiInsights] = useState<Record<string, unknown> | null>(null);

  const metrics = data?.data;

  const fetchAiInsights = async () => {
    try {
      const result = await getInsights({ period }).unwrap();
      setAiInsights(result.data);
    } catch { /* */ }
  };

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      children: isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <OverviewTab metrics={metrics} aiInsights={aiInsights} onFetchInsights={fetchAiInsights} aiLoading={aiLoading} />
      ),
    },
    {
      key: 'content',
      label: 'Content Performance',
      children: <ContentPerformanceTab period={period} metrics={metrics} />,
    },
    {
      key: 'audience',
      label: 'Audience',
      children: <AudienceTab />,
    },
    {
      key: 'reports',
      label: 'Reports',
      children: <ReportsTab />,
    },
    {
      key: 'post',
      label: 'Post Drill-down',
      children: <PostAnalyticsTab />,
    },
  ];

  return (
    <div>
      <PageHeader
        icon={faChartLine}
        title="Analytics"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button.Group>
              {PERIODS.map((p) => (
                <Button key={p} type={period === p ? 'primary' : 'default'} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </Button.Group>
          </div>
        }
      />

      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as AnalyticsTab)} items={tabs} />
    </div>
  );
}
