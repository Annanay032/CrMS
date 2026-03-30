import { useState } from 'react';
import { Table, Tag, Typography, Select, Button, Input, Space, Avatar, Modal, message, Form, Tabs, Tooltip, Badge } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSearch, faUserShield, faUserPlus, faEnvelope, faCopy, faLink, faBan } from '@fortawesome/free-solid-svg-icons';
import {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useCreateInviteMutation,
  useGetInvitesQuery,
  useRevokeInviteMutation,
} from '@/store/endpoints/admin';
import type { AdminUser, Invite } from '@/store/endpoints/admin';
import { getInitials } from '@/utils/format';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  CREATOR: 'blue',
  BRAND: 'green',
  AGENCY: 'purple',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'processing',
  ACCEPTED: 'success',
  EXPIRED: 'default',
  REVOKED: 'error',
};

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [inviteStatusFilter, setInviteStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [form] = Form.useForm();

  const { data, isLoading } = useGetAdminUsersQuery({ page, limit: 20, role: roleFilter });
  const { data: invitesData, isLoading: invitesLoading } = useGetInvitesQuery({ page: invitePage, limit: 20, status: inviteStatusFilter });
  const [updateRole] = useUpdateUserRoleMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [createInvite, { isLoading: creating }] = useCreateInviteMutation();
  const [revokeInvite] = useRevokeInviteMutation();

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const invites = invitesData?.data ?? [];
  const invitePagination = invitesData?.pagination;

  const handleRoleChange = (userId: string, role: string) => {
    Modal.confirm({
      title: 'Change User Role',
      content: `Are you sure you want to change this user's role to ${role}?`,
      onOk: async () => {
        try {
          await updateRole({ id: userId, role }).unwrap();
          message.success('Role updated');
        } catch {
          message.error('Failed to update role');
        }
      },
    });
  };

  const handleToggleActive = (user: AdminUser) => {
    Modal.confirm({
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      content: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`,
      okButtonProps: { danger: user.isActive },
      onOk: async () => {
        try {
          await toggleActive(user.id).unwrap();
          message.success(user.isActive ? 'User deactivated' : 'User activated');
        } catch {
          message.error('Failed to update user status');
        }
      },
    });
  };

  const handleSendInvite = async () => {
    try {
      const values = await form.validateFields();
      const result = await createInvite(values).unwrap();
      message.success('Invite created');

      if (result.data?.inviteUrl) {
        Modal.success({
          title: 'Invite Created',
          content: (
            <div>
              <Text>Share this link with <strong>{values.email}</strong>:</Text>
              <Input.TextArea
                value={result.data.inviteUrl}
                readOnly
                autoSize={{ minRows: 2 }}
                style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button
                type="link"
                icon={<FontAwesomeIcon icon={faCopy} />}
                onClick={() => {
                  navigator.clipboard.writeText(result.data.inviteUrl!);
                  message.success('Link copied!');
                }}
                style={{ padding: 0, marginTop: 8 }}
              >
                Copy invite link
              </Button>
              <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 12 }}>
                Expires in 72 hours. The user will register with the role: <Tag color={ROLE_COLORS[values.role]}>{values.role}</Tag>
              </div>
            </div>
          ),
          width: 520,
        });
      }

      form.resetFields();
      setInviteModalOpen(false);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to create invite';
      message.error(msg);
    }
  };

  const handleRevoke = (invite: Invite) => {
    Modal.confirm({
      title: 'Revoke Invite',
      content: `Revoke the pending invite for ${invite.email}? They will no longer be able to register with this link.`,
      okButtonProps: { danger: true },
      okText: 'Revoke',
      onOk: async () => {
        try {
          await revokeInvite(invite.id).unwrap();
          message.success('Invite revoked');
        } catch {
          message.error('Failed to revoke invite');
        }
      },
    });
  };

  const copyInviteLink = (invite: Invite) => {
    const url = `${window.location.origin}/register?invite=${invite.token}`;
    navigator.clipboard.writeText(url);
    message.success('Invite link copied!');
  };

  const filteredUsers = search
    ? users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: AdminUser) => (
        <Space>
          <Avatar style={{ background: '#6366f1' }}>{getInitials(record.name)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 160,
      render: (_: unknown, record: AdminUser) => (
        <Select
          value={record.role}
          size="small"
          style={{ width: 130 }}
          onChange={(val) => handleRoleChange(record.id, val)}
          options={[
            { label: 'Creator', value: 'CREATOR' },
            { label: 'Brand', value: 'BRAND' },
            { label: 'Agency', value: 'AGENCY' },
            { label: 'Admin', value: 'ADMIN' },
          ]}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: AdminUser) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: AdminUser) => (
        <Button
          size="small"
          danger={record.isActive}
          onClick={() => handleToggleActive(record)}
        >
          {record.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  const inviteColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <FontAwesomeIcon icon={faEnvelope} style={{ color: '#94a3b8' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => <Tag color={ROLE_COLORS[role] ?? 'default'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Badge status={STATUS_COLORS[status] as any} text={status} />,
    },
    {
      title: 'Invited By',
      key: 'invitedBy',
      width: 160,
      render: (_: unknown, record: Invite) => <Text type="secondary">{record.invitedBy?.name}</Text>,
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 140,
      render: (date: string) => {
        const exp = new Date(date);
        const now = new Date();
        const isExpired = exp < now;
        return <Text type={isExpired ? 'secondary' : undefined}>{exp.toLocaleDateString()}</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Invite) => (
        <Space>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="Copy invite link">
                <Button size="small" icon={<FontAwesomeIcon icon={faLink} />} onClick={() => copyInviteLink(record)} />
              </Tooltip>
              <Tooltip title="Revoke invite">
                <Button size="small" danger icon={<FontAwesomeIcon icon={faBan} />} onClick={() => handleRevoke(record)} />
              </Tooltip>
            </>
          )}
          {record.status === 'ACCEPTED' && (
            <Text type="success" style={{ fontSize: 12 }}>{record.acceptedBy?.name}</Text>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = invites.filter((i) => i.status === 'PENDING').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: 12, color: '#6366f1' }} />
            User Management
          </Title>
          <Text type="secondary">Manage platform users, invite new members, and control access</Text>
        </div>
        <Button
          type="primary"
          icon={<FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />}
          onClick={() => setInviteModalOpen(true)}
        >
          Invite User
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'users',
            label: (
              <span>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} />
                Users ({pagination?.total ?? 0})
              </span>
            ),
            children: (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <Input
                    placeholder="Search users..."
                    prefix={<FontAwesomeIcon icon={faSearch} style={{ color: '#94a3b8' }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                    allowClear
                  />
                  <Select
                    placeholder="Filter by role"
                    value={roleFilter}
                    onChange={setRoleFilter}
                    allowClear
                    style={{ width: 160 }}
                    options={[
                      { label: 'All Roles', value: undefined },
                      { label: 'Creator', value: 'CREATOR' },
                      { label: 'Brand', value: 'BRAND' },
                      { label: 'Agency', value: 'AGENCY' },
                      { label: 'Admin', value: 'ADMIN' },
                    ]}
                  />
                </div>
                <Table
                  dataSource={filteredUsers}
                  columns={userColumns}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: pagination?.total ?? 0,
                    onChange: setPage,
                    showSizeChanger: false,
                  }}
                  size="middle"
                />
              </>
            ),
          },
          {
            key: 'invites',
            label: (
              <span>
                <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 6 }} />
                Invites
                {pendingCount > 0 && <Badge count={pendingCount} size="small" style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <Select
                    placeholder="Filter by status"
                    value={inviteStatusFilter}
                    onChange={setInviteStatusFilter}
                    allowClear
                    style={{ width: 180 }}
                    options={[
                      { label: 'All Statuses', value: undefined },
                      { label: 'Pending', value: 'PENDING' },
                      { label: 'Accepted', value: 'ACCEPTED' },
                      { label: 'Expired', value: 'EXPIRED' },
                      { label: 'Revoked', value: 'REVOKED' },
                    ]}
                  />
                  <div style={{ marginLeft: 'auto' }}>
                    <Button
                      type="primary"
                      icon={<FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />}
                      onClick={() => setInviteModalOpen(true)}
                    >
                      New Invite
                    </Button>
                  </div>
                </div>
                <Table
                  dataSource={invites}
                  columns={inviteColumns}
                  rowKey="id"
                  loading={invitesLoading}
                  pagination={{
                    current: invitePage,
                    pageSize: 20,
                    total: invitePagination?.total ?? 0,
                    onChange: setInvitePage,
                    showSizeChanger: false,
                  }}
                  size="middle"
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={
          <Space>
            <FontAwesomeIcon icon={faUserPlus} style={{ color: '#6366f1' }} />
            Invite New User
          </Space>
        }
        open={inviteModalOpen}
        onCancel={() => { setInviteModalOpen(false); form.resetFields(); }}
        onOk={handleSendInvite}
        confirmLoading={creating}
        okText="Send Invite"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="user@company.com" prefix={<FontAwesomeIcon icon={faEnvelope} style={{ color: '#94a3b8' }} />} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Assign Role"
            rules={[{ required: true, message: 'Select a role' }]}
            initialValue="CREATOR"
          >
            <Select
              options={[
                { label: 'Creator', value: 'CREATOR' },
                { label: 'Brand', value: 'BRAND' },
                { label: 'Agency', value: 'AGENCY' },
                { label: 'Admin', value: 'ADMIN' },
              ]}
            />
          </Form.Item>

          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b' }}>
            <FontAwesomeIcon icon={faUserShield} style={{ marginRight: 8 }} />
            A secure invite link will be generated. The link expires in <strong>72 hours</strong> and can only be used once.
            The invited user will register with the selected role pre-assigned.
          </div>
        </Form>
      </Modal>
    </div>
  );
}
