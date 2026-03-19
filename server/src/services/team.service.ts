import { prisma } from '../config/index.js';
import type { TeamRole } from '../types/enums.js';

// ─── Team CRUD ───────────────────────────────────────────────

export async function createTeam(ownerId: string, data: { name: string; avatarUrl?: string }) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: { name: data.name, ownerId, avatarUrl: data.avatarUrl },
    });

    // Owner is automatically the first member
    await tx.teamMember.create({
      data: { teamId: team.id, userId: ownerId, role: 'OWNER' },
    });

    return team;
  });
}

export async function getTeamsByUser(userId: string) {
  return prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } },
      _count: { select: { members: true, posts: true, workflows: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTeamById(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } },
      workflows: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      _count: { select: { members: true, posts: true } },
    },
  });

  if (!team) throw new Error('Team not found or access denied');
  return team;
}

export async function updateTeam(teamId: string, userId: string, data: { name?: string; avatarUrl?: string }) {
  await assertTeamRole(teamId, userId, ['OWNER', 'ADMIN']);
  return prisma.team.update({ where: { id: teamId }, data });
}

export async function deleteTeam(teamId: string, userId: string) {
  await assertTeamRole(teamId, userId, ['OWNER']);
  return prisma.team.delete({ where: { id: teamId } });
}

// ─── Member Management ──────────────────────────────────────

export async function addMember(teamId: string, requesterId: string, data: { email: string; role: TeamRole }) {
  await assertTeamRole(teamId, requesterId, ['OWNER', 'ADMIN']);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error('User not found with that email');

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (existing) throw new Error('User is already a member of this team');

  return prisma.teamMember.create({
    data: { teamId, userId: user.id, role: data.role },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
  });
}

export async function updateMemberRole(teamId: string, requesterId: string, memberId: string, role: TeamRole) {
  await assertTeamRole(teamId, requesterId, ['OWNER', 'ADMIN']);

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || member.teamId !== teamId) throw new Error('Member not found');
  if (member.role === 'OWNER') throw new Error('Cannot change owner role');

  return prisma.teamMember.update({ where: { id: memberId }, data: { role } });
}

export async function removeMember(teamId: string, requesterId: string, memberId: string) {
  await assertTeamRole(teamId, requesterId, ['OWNER', 'ADMIN']);

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || member.teamId !== teamId) throw new Error('Member not found');
  if (member.role === 'OWNER') throw new Error('Cannot remove team owner');

  return prisma.teamMember.delete({ where: { id: memberId } });
}

// ─── Approval Workflows ─────────────────────────────────────

export async function createWorkflow(teamId: string, userId: string, data: {
  name: string;
  stages: Array<{ name: string; approverRoles: string[] }>;
  isDefault?: boolean;
}) {
  await assertTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

  // If this is default, unset any existing default
  if (data.isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: { teamId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.approvalWorkflow.create({
    data: {
      teamId,
      name: data.name,
      stages: data.stages as any,
      isDefault: data.isDefault ?? false,
    },
  });
}

export async function getWorkflows(teamId: string, userId: string) {
  await assertTeamRole(teamId, userId, ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER']);
  return prisma.approvalWorkflow.findMany({
    where: { teamId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateWorkflow(workflowId: string, userId: string, data: {
  name?: string;
  stages?: Array<{ name: string; approverRoles: string[] }>;
  isDefault?: boolean;
  isActive?: boolean;
}) {
  const workflow = await prisma.approvalWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error('Workflow not found');

  await assertTeamRole(workflow.teamId, userId, ['OWNER', 'ADMIN']);

  if (data.isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: { teamId: workflow.teamId, isDefault: true, id: { not: workflowId } },
      data: { isDefault: false },
    });
  }

  return prisma.approvalWorkflow.update({
    where: { id: workflowId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.stages !== undefined && { stages: data.stages as any }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deleteWorkflow(workflowId: string, userId: string) {
  const workflow = await prisma.approvalWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error('Workflow not found');

  await assertTeamRole(workflow.teamId, userId, ['OWNER', 'ADMIN']);

  return prisma.approvalWorkflow.delete({ where: { id: workflowId } });
}

// ─── Post Comments (Approval Feedback) ──────────────────────

export async function addPostComment(postId: string, userId: string, data: {
  body: string;
  isApproval?: boolean;
  approvalAction?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { creatorProfile: true } });

  return prisma.postComment.create({
    data: {
      postId,
      userId,
      creatorProfileId: user?.creatorProfile?.id,
      body: data.body,
      isApproval: data.isApproval ?? false,
      approvalAction: data.approvalAction,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

export async function getPostComments(postId: string) {
  return prisma.postComment.findMany({
    where: { postId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Approval State Machine ─────────────────────────────────

export async function submitForApproval(postId: string, _userId: string, teamId: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      approvalStatus: 'PENDING_REVIEW',
      teamId,
      status: 'REVIEW',
    },
  });
}

export async function approvePost(postId: string, userId: string, comment?: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');
  if (!post.teamId) throw new Error('Post is not in a team workflow');

  await assertTeamRole(post.teamId, userId, ['OWNER', 'ADMIN', 'EDITOR']);

  if (comment) {
    await addPostComment(postId, userId, {
      body: comment,
      isApproval: true,
      approvalAction: 'approve',
    });
  }

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      approvalStatus: 'APPROVED',
      status: 'APPROVED',
    },
  });
}

export async function requestChanges(postId: string, userId: string, comment: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');
  if (!post.teamId) throw new Error('Post is not in a team workflow');

  await assertTeamRole(post.teamId, userId, ['OWNER', 'ADMIN', 'EDITOR']);

  await addPostComment(postId, userId, {
    body: comment,
    isApproval: true,
    approvalAction: 'request_changes',
  });

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      approvalStatus: 'CHANGES_REQUESTED',
      status: 'DRAFT',
    },
  });
}

export async function rejectPost(postId: string, userId: string, comment: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');
  if (!post.teamId) throw new Error('Post is not in a team workflow');

  await assertTeamRole(post.teamId, userId, ['OWNER', 'ADMIN']);

  await addPostComment(postId, userId, {
    body: comment,
    isApproval: true,
    approvalAction: 'reject',
  });

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      approvalStatus: 'REJECTED',
    },
  });
}

// ─── Team Calendar ───────────────────────────────────────────

export async function getTeamCalendar(teamId: string, userId: string, month: number, year: number) {
  await assertTeamRole(teamId, userId, ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER']);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.contentPost.findMany({
    where: {
      teamId,
      OR: [
        { scheduledAt: { gte: start, lte: end } },
        { publishedAt: { gte: start, lte: end } },
        { createdAt: { gte: start, lte: end }, scheduledAt: null },
      ],
    },
    include: {
      analytics: true,
      creatorProfile: { include: { user: { select: { name: true, avatarUrl: true } } } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

// ─── Helpers ─────────────────────────────────────────────────

async function assertTeamRole(teamId: string, userId: string, allowedRoles: string[]) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) throw new Error('Not a member of this team');
  if (!allowedRoles.includes(member.role)) throw new Error('Insufficient permissions');
}
