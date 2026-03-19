import { useState } from 'react';
import { Card, Button, Empty, Typography, Row, Col, Segmented, Spin, Input, Select, Badge, Drawer, Space, Tabs, Statistic } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faComments, faReply, faExclamation, faQuestion,
  faInbox, faEnvelopeOpen, faFire, faBookmark, faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetInteractionsQuery, useGetCommunityStatsQuery,
  useMarkRespondedMutation, useMarkBulkReadMutation,
  useGetSavedRepliesQuery, useCreateSavedReplyMutation, useDeleteSavedReplyMutation,
  useGetVoiceProfileQuery,
} from '@/store/endpoints/community';
import { useGetEngagementSuggestionsMutation } from '@/store/endpoints/agents';
import { StatCard } from '@/components/common';
import type { Interaction } from './types';
import { InteractionCard } from './components/InteractionCard';
import { SavedRepliesDrawer } from './components/SavedRepliesDrawer';
import { VoiceProfileDrawer } from './components/VoiceProfileDrawer';

const { Title, Text } = Typography;

export function CommunityPage() {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [voiceProfileOpen, setVoiceProfileOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const responded = filter === 'pending' ? 'false' : filter === 'responded' ? 'true' : undefined;
  const isRead = filter === 'unread' ? 'false' : undefined;
  const caseStatus = filter === 'open' ? 'OPEN' : filter === 'in_progress' ? 'IN_PROGRESS' : filter === 'resolved' ? 'RESOLVED' : undefined;
  const priority = filter === 'high_priority' ? 'HIGH' : priorityFilter || undefined;

  const { data, isLoading, refetch } = useGetInteractionsQuery({
    page, responded, isRead, caseStatus, priority, sortBy,
    platform: platformFilter, search: search || undefined,
  });
  const { data: statsData } = useGetCommunityStatsQuery();
  const [getSuggestions, { isLoading: aiLoading }] = useGetEngagementSuggestionsMutation();
  const [markResponded] = useMarkRespondedMutation();
  const [markBulkRead] = useMarkBulkReadMutation();
  const { data: savedRepliesData } = useGetSavedRepliesQuery();
  const { data: voiceProfileData } = useGetVoiceProfileQuery();

  const interactions: Interaction[] = (data?.data ?? []) as unknown as Interaction[];
  const stats = statsData?.data;
  const pagination = data?.pagination;

  const fetchSuggestions = async () => {
    try {
      await getSuggestions({}).unwrap();
      refetch();
    } catch { /* */ }
  };

  const handleMarkResponded = async (id: string) => {
    try {
      await markResponded(id).unwrap();
    } catch { /* */ }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = interactions.filter((i) => !i.isRead).map((i) => i.id);
    if (unreadIds.length > 0) {
      try { await markBulkRead(unreadIds).unwrap(); } catch { /* */ }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faInbox} style={{ marginRight: 8 }} /> Community Hub
        </Title>
        <Space>
          <Button icon={<FontAwesomeIcon icon={faBookmark} />} onClick={() => setSavedRepliesOpen(true)}>
            Saved Replies {savedRepliesData?.data ? `(${savedRepliesData.data.length})` : ''}
          </Button>
          <Button icon={<FontAwesomeIcon icon={faMicrophone} />} onClick={() => setVoiceProfileOpen(true)}>
            Voice Profile {voiceProfileData?.data ? '✓' : ''}
          </Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faRobot} />} onClick={fetchSuggestions} loading={aiLoading}>
            Generate AI Replies
          </Button>
        </Space>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6} md={4}>
            <StatCard icon={faComments} label="Total" value={String(stats.total ?? 0)} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <StatCard icon={faReply} label="Pending" value={String(stats.pending ?? 0)} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <StatCard icon={faEnvelopeOpen} label="Unread" value={String(stats.unread ?? 0)} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <StatCard icon={faFire} label="High Priority" value={String(stats.highPriority ?? 0)} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <StatCard icon={faExclamation} label="Negative" value={String(stats.negative ?? 0)} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card size="small">
              <Statistic title="Response Rate" value={stats.responseRate ?? 0} suffix="%" valueStyle={{ fontSize: 20 }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters bar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input.Search
            placeholder="Search messages..."
            style={{ width: 260 }}
            onSearch={(v) => { setSearch(v); setPage(1); }}
            allowClear
          />
          <Select
            placeholder="Platform"
            allowClear
            style={{ width: 130 }}
            value={platformFilter}
            onChange={(v) => { setPlatformFilter(v); setPage(1); }}
            options={['INSTAGRAM', 'YOUTUBE', 'TWITTER', 'TIKTOK', 'FACEBOOK', 'LINKEDIN'].map((p) => ({ label: p, value: p }))}
          />
          <Select
            placeholder="Priority"
            allowClear
            style={{ width: 120 }}
            value={priorityFilter}
            onChange={(v) => { setPriorityFilter(v); setPage(1); }}
            options={[{ label: 'High', value: 'HIGH' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'Low', value: 'LOW' }]}
          />
          <Select
            value={sortBy}
            style={{ width: 130 }}
            onChange={(v) => setSortBy(v)}
            options={[{ label: 'Newest', value: 'newest' }, { label: 'Oldest', value: 'oldest' }, { label: 'Priority', value: 'priority' }]}
          />
          <div style={{ flex: 1 }} />
          {selectedIds.length > 0 && (
            <Text type="secondary">{selectedIds.length} selected</Text>
          )}
          <Button size="small" onClick={handleMarkAllRead} disabled={!interactions.some((i) => !i.isRead)}>
            Mark All Read
          </Button>
        </div>
      </Card>

      <Card
        title={
          <Segmented
            value={filter}
            onChange={(v) => { setFilter(v as string); setPage(1); }}
            options={[
              { label: <Badge count={stats?.total ?? 0} overflowCount={999} size="small" offset={[8, -2]}>All</Badge>, value: 'all' },
              { label: <Badge count={stats?.unread ?? 0} overflowCount={999} size="small" offset={[8, -2]}>Unread</Badge>, value: 'unread' },
              { label: 'Pending', value: 'pending' },
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: <Badge count={stats?.highPriority ?? 0} overflowCount={99} size="small" offset={[8, -2]} color="red">High Priority</Badge>, value: 'high_priority' },
            ]}
          />
        }
        extra={
          pagination ? (
            <Space>
              <Text type="secondary">
                Page {page} of {pagination.totalPages ?? 1} ({pagination.total ?? 0} total)
              </Text>
              <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="small" disabled={page >= (pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </Space>
          ) : null
        }
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : interactions.length === 0 ? (
          <Empty description={<>No interactions found.<br /><Text type="secondary">Connect your social accounts to start managing comments &amp; DMs.</Text></>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {interactions.map((i) => (
              <InteractionCard
                key={i.id}
                interaction={i}
                selected={selectedIds.includes(i.id)}
                onToggleSelect={() => toggleSelect(i.id)}
                onMarkResponded={() => handleMarkResponded(i.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <SavedRepliesDrawer open={savedRepliesOpen} onClose={() => setSavedRepliesOpen(false)} />
      <VoiceProfileDrawer open={voiceProfileOpen} onClose={() => setVoiceProfileOpen(false)} />
    </div>
  );
}
