import { useState } from 'react';
import { Table, Tag, Typography, Select, Space, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faClock, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useGetAdminAgentHistoryQuery } from '@/store/endpoints/admin';
import type { AdminAgentTask } from '@/store/endpoints/admin';

const { Title, Text } = Typography;

const STATUS_MAP: Record<string, { color: string; icon: typeof faCheckCircle }> = {
  COMPLETED: { color: 'green', icon: faCheckCircle },
  RUNNING: { color: 'blue', icon: faClock },
  FAILED: { color: 'red', icon: faTimesCircle },
  PENDING: { color: 'default', icon: faClock },
};

const AGENT_TYPES = [
  'CONTENT_GENERATION', 'SCHEDULING', 'MATCHING',
  'ANALYTICS', 'ENGAGEMENT', 'TREND_DETECTION', 'GROWTH',
];

export function AdminAgentLogsPage() {
  const [page, setPage] = useState(1);
  const [agentTypeFilter, setAgentTypeFilter] = useState<string | undefined>();
  const { data, isLoading } = useGetAdminAgentHistoryQuery({ page, limit: 20, agentType: agentTypeFilter });

  const tasks = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    {
      title: 'Agent',
      dataIndex: 'agentType',
      key: 'agentType',
      width: 200,
      render: (type: string) => (
        <Tag color="purple" style={{ fontSize: 12 }}>
          <FontAwesomeIcon icon={faRobot} style={{ marginRight: 6 }} />
          {type.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_: unknown, record: AdminAgentTask) => record.user ? (
        <Space direction="vertical" size={0}>
          <Text style={{ fontWeight: 500 }}>{record.user.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.user.email}</Text>
        </Space>
      ) : (
        <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
        return (
          <Tag color={cfg.color}>
            <FontAwesomeIcon icon={cfg.icon} style={{ marginRight: 4 }} />
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Tokens',
      dataIndex: 'tokensUsed',
      key: 'tokensUsed',
      width: 100,
      render: (val: number) => val ? val.toLocaleString() : '—',
    },
    {
      title: 'Started',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 170,
      render: (date: string | null) => date ? new Date(date).toLocaleString() : '—',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faRobot} style={{ marginRight: 12, color: '#6366f1' }} />
          Agent Logs
        </Title>
        <Text type="secondary">Monitor AI agent task history across all users</Text>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="Filter by agent type"
          value={agentTypeFilter}
          onChange={setAgentTypeFilter}
          allowClear
          style={{ width: 220 }}
          options={AGENT_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))}
        />
        <div style={{ marginLeft: 'auto' }}>
          <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
            {pagination?.total ?? 0} total tasks
          </Tag>
        </div>
      </div>

      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: <Empty description="No agent tasks found" /> }}
        pagination={{
          current: page,
          pageSize: 20,
          total: pagination?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        size="middle"
        scroll={{ x: 960 }}
      />
    </div>
  );
}
