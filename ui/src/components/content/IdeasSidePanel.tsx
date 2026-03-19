import { useState } from 'react';
import { Drawer, List, Input, Tag, Empty, Typography, Button, Space, Badge } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faArrowRight, faFilter } from '@fortawesome/free-solid-svg-icons';
import { useGetIdeasQuery } from '@/store/endpoints/ideas';
import type { ContentIdea, IdeaStatus } from '@/types';

const { Text, Paragraph } = Typography;
const { Search } = Input;

interface IdeasSidePanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (idea: ContentIdea) => void;
}

const STATUS_COLORS: Record<IdeaStatus, string> = {
  SPARK: 'magenta',
  DEVELOPING: 'blue',
  READY: 'green',
  ARCHIVED: 'default',
};

export function IdeasSidePanel({ open, onClose, onApply }: IdeasSidePanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | undefined>();

  const { data, isLoading } = useGetIdeasQuery({ status: statusFilter, limit: 50 });
  const ideas = data?.data ?? [];

  const filtered = search
    ? ideas.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.body?.toLowerCase().includes(search.toLowerCase()),
      )
    : ideas;

  const statuses: IdeaStatus[] = ['SPARK', 'DEVELOPING', 'READY', 'ARCHIVED'];

  return (
    <Drawer
      title={
        <Space>
          <FontAwesomeIcon icon={faLightbulb} style={{ color: '#faad14' }} />
          <span>Ideas</span>
          <Badge count={ideas.length} style={{ backgroundColor: '#1677ff' }} />
        </Space>
      }
      open={open}
      onClose={onClose}
      width={380}
      placement="right"
    >
      <Search
        placeholder="Search ideas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Button
          size="small"
          icon={<FontAwesomeIcon icon={faFilter} style={{ fontSize: 10 }} />}
          type={!statusFilter ? 'primary' : 'default'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {statuses.map((s) => (
          <Button
            key={s}
            size="small"
            type={statusFilter === s ? 'primary' : 'default'}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </Space>

      {filtered.length === 0 ? (
        <Empty description="No ideas found" />
      ) : (
        <List
          loading={isLoading}
          dataSource={filtered}
          renderItem={(idea) => (
            <List.Item
              style={{ padding: '8px 0' }}
              actions={[
                <Button
                  key="apply"
                  type="text"
                  size="small"
                  icon={<FontAwesomeIcon icon={faArrowRight} />}
                  onClick={() => onApply(idea)}
                />,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong style={{ fontSize: 13 }}>{idea.title}</Text>
                    <Tag color={STATUS_COLORS[idea.status]} style={{ fontSize: 10 }}>
                      {idea.status}
                    </Tag>
                  </Space>
                }
                description={
                  <>
                    {idea.body && (
                      <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: 0 }}>
                        {idea.body}
                      </Paragraph>
                    )}
                    {idea.tags.length > 0 && (
                      <Space wrap style={{ marginTop: 4 }}>
                        {idea.tags.map(({ tag }) => (
                          <Tag key={tag.id} color={tag.color} style={{ fontSize: 10 }}>
                            {tag.name}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
