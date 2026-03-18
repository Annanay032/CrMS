import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import { useGetTrendsMutation } from '@/store/endpoints/agents';
import type { Trend } from '@/types';
import { TrendCard } from './components/TrendCard';

const { Title, Paragraph } = Typography;

export function TrendsPage() {
  const [getTrends, { isLoading }] = useGetTrendsMutation();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [summary, setSummary] = useState('');

  const fetchTrends = async () => {
    try {
      const result = await getTrends({ niche: ['general'], platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] }).unwrap();
      setTrends((result.data?.trends as unknown as Trend[]) ?? []);
      setSummary((result.data?.summary as string) ?? '');
    } catch { /* */ }
  };

  useEffect(() => { fetchTrends(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Trending Now</Title>
        <Button type="primary" icon={<FontAwesomeIcon icon={faArrowTrendUp} />} onClick={fetchTrends} loading={isLoading}>
          Refresh Trends
        </Button>
      </div>

      {summary && (
        <Card style={{ marginBottom: 24 }}>
          <Paragraph style={{ margin: 0 }}>{summary}</Paragraph>
        </Card>
      )}

      {isLoading && trends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {trends.map((t, i) => (
            <Col key={i} xs={24} md={12}>
              <TrendCard trend={t} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
