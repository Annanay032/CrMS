import { useState } from 'react';
import { Card, Button, Input, Modal, Form, Select, Table, Tag, Space, Typography, Popconfirm, Empty, message, Tabs, List } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faTrash, faPen, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common';
import {
  useGetMyTeamsQuery,
  useGetTeamQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useCreateWorkflowMutation,
  useDeleteWorkflowMutation,
} from '@/store/endpoints/teams';
import type { Team, TeamMember, ApprovalWorkflow } from '@/types';

const { Text, Title } = Typography;
const ROLE_COLORS: Record<string, string> = { OWNER: 'gold', ADMIN: 'red', EDITOR: 'blue', CONTRIBUTOR: 'green', VIEWER: 'default' };

export function TeamSettingsPage() {
  const { data: teamsRes, isLoading } = useGetMyTeamsQuery();
  const [createTeam] = useCreateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const teams = teamsRes?.data ?? [];

  const handleCreateTeam = async (values: { name: string }) => {
    try {
      const result = await createTeam(values).unwrap();
      message.success('Team created');
      setCreateModalOpen(false);
      createForm.resetFields();
      setSelectedTeamId(result.data?.id ?? null);
    } catch {
      message.error('Failed to create team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await deleteTeam(id).unwrap();
      message.success('Team deleted');
      if (selectedTeamId === id) setSelectedTeamId(null);
    } catch {
      message.error('Failed to delete team');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader icon={faUsers} title="Team Settings" />

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>My Teams</Title>
          <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreateModalOpen(true)}>
            New Team
          </Button>
        </div>

        {teams.length === 0 && !isLoading ? (
          <Empty description="No teams yet. Create one to start collaborating!" />
        ) : (
          <List
            loading={isLoading}
            dataSource={teams}
            renderItem={(team: Team) => (
              <List.Item
                actions={[
                  <Button key="select" type={selectedTeamId === team.id ? 'primary' : 'default'} size="small" onClick={() => setSelectedTeamId(team.id)}>
                    {selectedTeamId === team.id ? 'Selected' : 'Manage'}
                  </Button>,
                  <Popconfirm key="delete" title="Delete this team?" onConfirm={() => handleDeleteTeam(team.id)}>
                    <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={team.name}
                  description={`${team._count?.members ?? 0} members · ${team._count?.posts ?? 0} posts`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {selectedTeamId && <TeamDetail teamId={selectedTeamId} />}

      <Modal title="Create Team" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} onOk={() => createForm.submit()} okText="Create">
        <Form form={createForm} layout="vertical" onFinish={handleCreateTeam}>
          <Form.Item name="name" label="Team Name" rules={[{ required: true, message: 'Enter a team name' }]}>
            <Input placeholder="e.g. Marketing Team" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ─── Team Detail Panel ───────────────────────────────────────

function TeamDetail({ teamId }: { teamId: string }) {
  const { data: teamRes, isLoading } = useGetTeamQuery(teamId);
  const [updateTeam] = useUpdateTeamMutation();
  const team = teamRes?.data;

  const [renameForm] = Form.useForm();
  const [renaming, setRenaming] = useState(false);

  const handleRename = async (values: { name: string }) => {
    try {
      await updateTeam({ id: teamId, data: { name: values.name } }).unwrap();
      message.success('Team renamed');
      setRenaming(false);
    } catch {
      message.error('Failed to rename');
    }
  };

  if (isLoading || !team) return <Card loading />;

  return (
    <Card>
      <Tabs
        items={[
          {
            key: 'members',
            label: <><FontAwesomeIcon icon={faUsers} style={{ marginRight: 8 }} />Members</>,
            children: <MembersTab team={team} />,
          },
          {
            key: 'workflows',
            label: <><FontAwesomeIcon icon={faListCheck} style={{ marginRight: 8 }} />Workflows</>,
            children: <WorkflowsTab team={team} />,
          },
          {
            key: 'settings',
            label: <><FontAwesomeIcon icon={faPen} style={{ marginRight: 8 }} />Settings</>,
            children: (
              <div>
                <Title level={5}>Team Name</Title>
                {renaming ? (
                  <Form form={renameForm} layout="inline" onFinish={handleRename} initialValues={{ name: team.name }}>
                    <Form.Item name="name" rules={[{ required: true }]}>
                      <Input maxLength={100} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Save</Button>
                    <Button onClick={() => setRenaming(false)} style={{ marginLeft: 8 }}>Cancel</Button>
                  </Form>
                ) : (
                  <Space>
                    <Text strong>{team.name}</Text>
                    <Button size="small" onClick={() => setRenaming(true)}>Rename</Button>
                  </Space>
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}

// ─── Members Tab ─────────────────────────────────────────────

function MembersTab({ team }: { team: Team }) {
  const [addMember] = useAddTeamMemberMutation();
  const [updateRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = async (values: { email: string; role: string }) => {
    try {
      await addMember({ teamId: team.id, ...values }).unwrap();
      message.success('Member added');
      setModalOpen(false);
      form.resetFields();
    } catch (e: any) {
      message.error(e?.data?.error || 'Failed to add member');
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateRole({ teamId: team.id, memberId, role }).unwrap();
      message.success('Role updated');
    } catch {
      message.error('Failed to update role');
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember({ teamId: team.id, memberId }).unwrap();
      message.success('Member removed');
    } catch {
      message.error('Failed to remove member');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: ['user', 'name'], key: 'name' },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (role: string, record: TeamMember) => (
        record.role === 'OWNER' ? <Tag color="gold">OWNER</Tag> : (
          <Select value={role} size="small" style={{ width: 130 }} onChange={(v) => handleRoleChange(record.id, v)} options={[
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Editor', value: 'EDITOR' },
            { label: 'Contributor', value: 'CONTRIBUTOR' },
            { label: 'Viewer', value: 'VIEWER' },
          ]} />
        )
      ),
    },
    {
      title: '', key: 'actions',
      render: (_: unknown, record: TeamMember) => record.role !== 'OWNER' ? (
        <Popconfirm title="Remove this member?" onConfirm={() => handleRemove(record.id)}>
          <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text type="secondary">{team.members?.length ?? 0} members</Text>
        <Button type="primary" size="small" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setModalOpen(true)}>
          Add Member
        </Button>
      </div>
      <Table dataSource={team.members ?? []} columns={columns} rowKey="id" pagination={false} size="small" />

      <Modal title="Add Team Member" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Add">
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="CONTRIBUTOR" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Editor', value: 'EDITOR' },
              { label: 'Contributor', value: 'CONTRIBUTOR' },
              { label: 'Viewer', value: 'VIEWER' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Workflows Tab ───────────────────────────────────────────

function WorkflowsTab({ team }: { team: Team }) {
  const [createWorkflow] = useCreateWorkflowMutation();
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = async (values: { name: string; stages: string }) => {
    try {
      const stages = values.stages.split('\n').filter(Boolean).map((s) => {
        const [name, ...roles] = s.split(':').map((p) => p.trim());
        return { name, approverRoles: roles.length ? roles[0].split(',').map((r) => r.trim().toUpperCase()) : ['EDITOR'] };
      });
      await createWorkflow({ teamId: team.id, name: values.name, stages }).unwrap();
      message.success('Workflow created');
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Failed to create workflow');
    }
  };

  const handleDelete = async (workflowId: string) => {
    try {
      await deleteWorkflow({ teamId: team.id, workflowId }).unwrap();
      message.success('Workflow deleted');
    } catch {
      message.error('Failed to delete workflow');
    }
  };

  const workflows = team.workflows ?? [];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text type="secondary">{workflows.length} workflows</Text>
        <Button type="primary" size="small" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setModalOpen(true)}>
          New Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Empty description="No approval workflows. Create one to enable post reviews." />
      ) : (
        <List
          dataSource={workflows}
          renderItem={(wf: ApprovalWorkflow) => (
            <List.Item actions={[
              wf.isDefault && <Tag color="blue" key="default">Default</Tag>,
              <Popconfirm key="delete" title="Delete workflow?" onConfirm={() => handleDelete(wf.id)}>
                <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
              </Popconfirm>,
            ].filter(Boolean)}>
              <List.Item.Meta
                title={wf.name}
                description={
                  <Space direction="vertical" size={0}>
                    {(wf.stages ?? []).map((stage, i) => (
                      <Text key={i} type="secondary">
                        Stage {i + 1}: {stage.name} — {stage.approverRoles.map((r) => (
                          <Tag key={r} color={ROLE_COLORS[r] || 'default'} style={{ fontSize: 11 }}>{r}</Tag>
                        ))}
                      </Text>
                    ))}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal title="Create Approval Workflow" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Create">
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Workflow Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Standard Review" maxLength={100} />
          </Form.Item>
          <Form.Item name="stages" label="Stages (one per line: StageName: ROLE1,ROLE2)" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder={'Editor Review: EDITOR\nAdmin Sign-off: ADMIN,OWNER'} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
