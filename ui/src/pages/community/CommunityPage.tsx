import { useState } from 'react';
import { Card, Button, Empty, Typography, Row, Col, Segmented, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faComments, faReply, faExclamation, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { useGetInteractionsQuery, useGetCommunityStatsQuery, useMarkRespondedMutation } from '@/store/endpoints/community';
import { useGetEngagementSuggestionsMutation } from '@/store/endpoints/agents';
import { StatCard } from '@/components/common';
import type { Interaction } from './types';
import { InteractionCard } from './components/InteractionCard';

const { Title, Text } = Typography;

export function CommunityPage() {
  const [filter, setFilter] = useState<string>('all');
  const responded = filter === 'pending' ? 'false' : filter === 'responded' ? 'true' : undefined;
  const { data, isLoading, refetch } = useGetInteractionsQuery({ page: 1, responded });
  const { data: statsData } = useGetCommunityStatsQuery();
  const [getSuggestions, { isLoading: aiLoading }] = useGetEngagementSuggestionsMutation();
  const [markResponded] = useMarkRespondedMutation();

  const interactions: Interaction[] = (data?.data ?? []) as unknown as Interaction[];
  const stats = statsData?.data;

  const fetchSuggestions = async () => {
    try {
      await getSuggestions({}).unwrap();
      refetch();
    } catch { /* */ }
  };

  const handleMarkResponded = async (id: string) => {
    try {
      await markResponded(id).unwrap();
      refetch();
    } catch { /* */ }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Community Hub</Title>
        <Button type="primary" icon={<FontAwesomeIcon icon={faRobot} />} onClick={fetchSuggestions} loading={aiLoading}>
          Generate AI Replies
        </Button>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <StatCard icon={faComments} label="Total" value={String(stats.total ?? 0)} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard icon={faReply} label="Pending" value={String(stats.pending ?? 0)} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard icon={faExclamation} label="Negative" value={String(stats.negative ?? 0)} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard icon={faQuestion} label="Questions" value={String(stats.questions ?? 0)} />
          </Col>
        </Row>
      )}

      <Card
        title="Interactions"
        extra={
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as string)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Responded', value: 'responded' },
            ]}
          />
        }
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : interactions.length === 0 ? (
          <Empty description={<>No interactions found.<br /><Text type="secondary">Connect your social accounts to start managing comments &amp; DMs.</Text></>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {interactions.map((i) => (
              <InteractionCard key={i.id} interaction={i} onMarkResponded={() => handleMarkResponded(i.id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
