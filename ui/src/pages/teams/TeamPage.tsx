import { useState, useCallback, useMemo } from 'react';
import { Button, Input, Modal, Select, message, Tooltip, Tag } from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import {
  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetTeamCalendarQuery,
  useApprovePostMutation,
  useRequestPostChangesMutation,
  useRejectPostMutation,
  useGetPostCommentsQuery,
  useAddPostCommentMutation,
} from '@/store/endpoints/teams';
import type { Team, TeamRole, ApprovalWorkflow, ContentPost } from '@/types';
import s from './styles/Teams.module.scss';

type TabKey = 'overview' | 'members' | 'workflows' | 'approvals';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'members', label: 'Members' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'approvals', label: 'Approval Queue' },
];

const ROLES: TeamRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'];

const ROLE_COLORS: Record<TeamRole, string> = {
  OWNER: 'gold',
  ADMIN: 'blue',
  EDITOR: 'green',
  CONTRIBUTOR: 'purple',
  VIEWER: 'default',
};

export function TeamPage() {
  const { data: teamsRes, isLoading } = useGetMyTeamsQuery();
  const teams = useMemo(() => teamsRes?.data ?? [], [teamsRes]);

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<string>('CONTRIBUTOR');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfStages, setWfStages] = useState<Array<{ name: string; approverRoles: string[] }>>([{ name: 'Review', approverRoles: ['ADMIN'] }]);

  const activeTeam = useMemo(() => teams.find((t) => t.id === activeTeamId) ?? null, [teams, activeTeamId]);

  const [createTeam] = useCreateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [addMember] = useAddTeamMemberMutation();
  const [updateRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [createWorkflow] = useCreateWorkflowMutation();
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const [approvePost] = useApprovePostMutation();
  const [requestChanges] = useRequestPostChangesMutation();
  const [rejectPost] = useRejectPostMutation();
  const [addComment] = useAddPostCommentMutation();

  const { data: workflowsRes } = useGetWorkflowsQuery(activeTeamId!, { skip: !activeTeamId });
  const workflows = workflowsRes?.data ?? [];

  const now = new Date();
  const { data: calendarRes } = useGetTeamCalendarQuery(
    { teamId: activeTeamId!, month: now.getMonth() + 1, year: now.getFullYear() },
    { skip: !activeTeamId },
  );
  const pendingPosts = useMemo(
    () => (calendarRes?.data ?? []).filter((p: ContentPost) => p.approvalStatus === 'PENDING_REVIEW'),
    [calendarRes],
  );

  const handleCreateTeam = useCallback(async () => {
    if (!newTeamName.trim()) return;
    try {
      const res = await createTeam({ name: newTeamName.trim() }).unwrap();
      setActiveTeamId(res.data?.id ?? null);
      setNewTeamName('');
      setCreateOpen(false);
      message.success('Team created');
    } catch {
      message.error('Failed to create team');
    }
  }, [newTeamName, createTeam]);

  const handleDeleteTeam = useCallback(async (id: string) => {
    try {
      await deleteTeam(id).unwrap();
      if (activeTeamId === id) setActiveTeamId(null);
      message.success('Team deleted');
    } catch {
      message.error('Failed to delete team');
    }
  }, [deleteTeam, activeTeamId]);

  const handleAddMember = useCallback(async () => {
    if (!activeTeamId || !memberEmail.trim()) return;
    try {
      await addMember({ teamId: activeTeamId, email: memberEmail.trim(), role: memberRole }).unwrap();
      setMemberEmail('');
      setAddMemberOpen(false);
      message.success('Member added');
    } catch {
      message.error('Failed to add member');
    }
  }, [activeTeamId, memberEmail, memberRole, addMember]);

  const handleRoleChange = useCallback(async (memberId: string, role: string) => {
    if (!activeTeamId) return;
    try {
      await updateRole({ teamId: activeTeamId, memberId, role }).unwrap();
      message.success('Role updated');
    } catch {
      message.error('Failed to update role');
    }
  }, [activeTeamId, updateRole]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!activeTeamId) return;
    try {
      await removeMember({ teamId: activeTeamId, memberId }).unwrap();
      message.success('Member removed');
    } catch {
      message.error('Failed to remove member');
    }
  }, [activeTeamId, removeMember]);

  const handleCreateWorkflow = useCallback(async () => {
    if (!activeTeamId || !wfName.trim()) return;
    try {
      await createWorkflow({ teamId: activeTeamId, name: wfName.trim(), stages: wfStages, isDefault: workflows.length === 0 }).unwrap();
      setWfName('');
      setWfStages([{ name: 'Review', approverRoles: ['ADMIN'] }]);
      setWorkflowOpen(false);
      message.success('Workflow created');
    } catch {
      message.error('Failed to create workflow');
    }
  }, [activeTeamId, wfName, wfStages, workflows.length, createWorkflow]);

  const handleDeleteWorkflow = useCallback(async (wfId: string) => {
    if (!activeTeamId) return;
    try {
      await deleteWorkflow({ teamId: activeTeamId, workflowId: wfId }).unwrap();
      message.success('Workflow deleted');
    } catch {
      message.error('Failed to delete workflow');
    }
  }, [activeTeamId, deleteWorkflow]);

  const addStage = useCallback(() => {
    setWfStages((prev) => [...prev, { name: '', approverRoles: ['EDITOR'] }]);
  }, []);

  const updateStage = useCallback((idx: number, field: 'name' | 'approverRoles', val: string | string[]) => {
    setWfStages((prev) => prev.map((st, i) => (i === idx ? { ...st, [field]: val } : st)));
  }, []);

  const removeStage = useCallback((idx: number) => {
    setWfStages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  if (isLoading) return <div className={s.empty_state}>Loading teams…</div>;

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <TeamOutlined className={s.page_title__icon} />
          Teams
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New Team
        </Button>
      </div>

      {/* Team cards */}
      <div className={s.teams_grid}>
        {teams.map((team: Team) => (
          <div
            key={team.id}
            className={`${s.team_card} ${activeTeamId === team.id ? s['team_card--active'] : ''}`}
            onClick={() => setActiveTeamId(team.id)}
          >
            <div className={s.team_card__name}>{team.name}</div>
            <div className={s.team_card__meta}>
              {team._count?.members ?? team.members?.length ?? 0} members · {team._count?.workflows ?? 0} workflows
            </div>
            <div className={s.team_card__members}>
              {(team.members ?? []).slice(0, 5).map((m) => (
                <Tooltip key={m.id} title={m.user?.name ?? m.userId}>
                  <div className={s.member_avatar}>
                    {(m.user?.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                </Tooltip>
              ))}
              {(team.members?.length ?? 0) > 5 && (
                <div className={s.member_avatar}>+{(team.members?.length ?? 0) - 5}</div>
              )}
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className={s.empty_state}>No teams yet. Create one to start collaborating.</div>
        )}
      </div>

      {/* Selected team detail */}
      {activeTeam && (
        <>
          <div className={s.tab_bar}>
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`${s.tab_btn} ${tab === t.key ? s['tab_btn--active'] : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key === 'approvals' && pendingPosts.length > 0 && (
                  <Tag color="orange" style={{ marginLeft: 6 }}>{pendingPosts.length}</Tag>
                )}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className={s.members_section}>
              <div className={s.members_header}>
                <span className={s.members_title}>{activeTeam.name}</span>
                <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteTeam(activeTeam.id)}>
                  Delete Team
                </Button>
              </div>
              <p>Created {new Date(activeTeam.createdAt).toLocaleDateString()}</p>
              <p>{activeTeam._count?.members ?? activeTeam.members?.length ?? 0} members · {activeTeam._count?.posts ?? 0} posts · {activeTeam._count?.workflows ?? workflows.length} workflows</p>
            </div>
          )}

          {tab === 'members' && (
            <div className={s.members_section}>
              <div className={s.members_header}>
                <span className={s.members_title}>Members</span>
                <Button icon={<UserAddOutlined />} onClick={() => setAddMemberOpen(true)}>
                  Add Member
                </Button>
              </div>
              <div className={s.members_list}>
                {(activeTeam.members ?? []).map((m) => (
                  <div key={m.id} className={s.member_row}>
                    <div className={s.member_avatar}>{(m.user?.name ?? '?').charAt(0).toUpperCase()}</div>
                    <div className={s.member_row__info}>
                      <div className={s.member_row__info__name}>{m.user?.name ?? m.userId}</div>
                      <div className={s.member_row__info__email}>{m.user?.email ?? ''}</div>
                    </div>
                    <Select
                      value={m.role}
                      size="small"
                      options={ROLES.map((r) => ({ value: r, label: r }))}
                      onChange={(val) => handleRoleChange(m.id, val)}
                      disabled={m.role === 'OWNER'}
                    />
                    <Tag color={ROLE_COLORS[m.role]}>{m.role}</Tag>
                    {m.role !== 'OWNER' && (
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(m.id)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'workflows' && (
            <div className={s.workflows_section}>
              <div className={s.workflows_header}>
                <span className={s.members_title}>Approval Workflows</span>
                <Button icon={<BranchesOutlined />} onClick={() => setWorkflowOpen(true)}>
                  New Workflow
                </Button>
              </div>
              {workflows.map((wf: ApprovalWorkflow) => (
                <div key={wf.id} className={s.workflow_card}>
                  <div className={s.workflow_card__name}>
                    {wf.name}
                    {wf.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>Default</Tag>}
                    {!wf.isActive && <Tag color="red" style={{ marginLeft: 4 }}>Inactive</Tag>}
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      style={{ marginLeft: 'auto', float: 'right' }}
                    />
                  </div>
                  <div className={s.workflow_stages}>
                    {wf.stages.map((stage, i) => (
                      <span key={i}>
                        <span className={s.workflow_stage}>
                          {stage.name}
                          <Tag>{stage.approverRoles.join(', ')}</Tag>
                        </span>
                        {i < wf.stages.length - 1 && <span className={s.workflow_arrow}>→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {workflows.length === 0 && (
                <div className={s.empty_state}>No workflows. Create one to enable approval chains.</div>
              )}
            </div>
          )}

          {tab === 'approvals' && (
            <ApprovalQueue
              posts={pendingPosts}
              onApprove={(id) => approvePost({ postId: id })}
              onRequestChanges={(id, comment) => requestChanges({ postId: id, comment })}
              onReject={(id) => rejectPost({ postId: id })}
              onComment={(id, body) => addComment({ postId: id, body })}
            />
          )}
        </>
      )}

      {/* Create Team Modal */}
      <Modal title="Create Team" open={createOpen} onOk={handleCreateTeam} onCancel={() => setCreateOpen(false)} okText="Create">
        <Input
          placeholder="Team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onPressEnter={handleCreateTeam}
        />
      </Modal>

      {/* Add Member Modal */}
      <Modal title="Add Member" open={addMemberOpen} onOk={handleAddMember} onCancel={() => setAddMemberOpen(false)} okText="Add">
        <Input
          placeholder="Member email"
          value={memberEmail}
          onChange={(e) => setMemberEmail(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Select
          value={memberRole}
          onChange={setMemberRole}
          options={ROLES.filter((r) => r !== 'OWNER').map((r) => ({ value: r, label: r }))}
          style={{ width: '100%' }}
        />
      </Modal>

      {/* Create Workflow Modal */}
      <Modal title="Create Workflow" open={workflowOpen} onOk={handleCreateWorkflow} onCancel={() => setWorkflowOpen(false)} okText="Create" width={560}>
        <Input
          placeholder="Workflow name"
          value={wfName}
          onChange={(e) => setWfName(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Stages</div>
        {wfStages.map((stage, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="Stage name"
              value={stage.name}
              onChange={(e) => updateStage(i, 'name', e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              mode="multiple"
              value={stage.approverRoles}
              onChange={(val) => updateStage(i, 'approverRoles', val)}
              options={ROLES.map((r) => ({ value: r, label: r }))}
              style={{ flex: 1 }}
              placeholder="Approver roles"
            />
            {wfStages.length > 1 && (
              <Button icon={<DeleteOutlined />} onClick={() => removeStage(i)} />
            )}
          </div>
        ))}
        <Button type="dashed" icon={<PlusOutlined />} onClick={addStage} block>
          Add Stage
        </Button>
      </Modal>
    </div>
  );
}

/* ─── Approval Queue Sub-component ─── */

function ApprovalQueue({
  posts,
  onApprove,
  onRequestChanges,
  onReject,
  onComment,
}: {
  posts: ContentPost[];
  onApprove: (id: string) => void;
  onRequestChanges: (id: string, comment: string) => void;
  onReject: (id: string) => void;
  onComment: (id: string, body: string) => void;
}) {
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: commentsRes } = useGetPostCommentsQuery(commentPostId!, { skip: !commentPostId });
  const comments = commentsRes?.data ?? [];

  return (
    <div className={s.approval_section}>
      <div className={s.approval_header}>
        <span className={s.members_title}>Pending Approvals</span>
      </div>
      <div className={s.approval_list}>
        {posts.map((post: ContentPost) => (
          <div key={post.id} className={s.approval_card}>
            <div className={s.approval_card__content}>
              <div className={s.approval_card__content__title}>
                {post.caption ?? `${post.postType} post`}
              </div>
              <div className={s.approval_card__content__meta}>
                {post.platform} · {post.postType} · Scheduled {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'unscheduled'}
              </div>
              {commentPostId === post.id && (
                <div style={{ marginTop: 8 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ fontSize: 12, marginBottom: 4 }}>
                      <strong>{c.user?.name ?? 'Unknown'}:</strong> {c.body}
                      {c.approvalAction && <Tag style={{ marginLeft: 4 }}>{c.approvalAction}</Tag>}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <Input
                      size="small"
                      placeholder="Add comment…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        if (commentText.trim()) {
                          onComment(post.id, commentText.trim());
                          setCommentText('');
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className={s.approval_card__actions}>
              <Tooltip title="Approve">
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => onApprove(post.id)} />
              </Tooltip>
              <Tooltip title="Request Changes">
                <Button size="small" icon={<EditOutlined />} onClick={() => onRequestChanges(post.id, 'Please revise')} />
              </Tooltip>
              <Tooltip title="Reject">
                <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => onReject(post.id)} />
              </Tooltip>
              <Button size="small" onClick={() => setCommentPostId(commentPostId === post.id ? null : post.id)}>
                💬
              </Button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className={s.empty_state}>No posts pending approval.</div>
        )}
      </div>
    </div>
  );
}
