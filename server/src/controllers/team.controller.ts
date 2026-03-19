import type { Response } from 'express';
import * as teamService from '../services/team.service.js';
import type { AuthRequest } from '../types/common.js';

// ─── Team CRUD ───────────────────────────────────────────────

export async function createTeam(req: AuthRequest, res: Response) {
  const team = await teamService.createTeam(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: team });
}

export async function getMyTeams(req: AuthRequest, res: Response) {
  const teams = await teamService.getTeamsByUser(req.user!.userId);
  res.json({ success: true, data: teams });
}

export async function getTeam(req: AuthRequest, res: Response) {
  const team = await teamService.getTeamById(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: team });
}

export async function updateTeam(req: AuthRequest, res: Response) {
  const team = await teamService.updateTeam(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data: team });
}

export async function deleteTeam(req: AuthRequest, res: Response) {
  await teamService.deleteTeam(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Team deleted' });
}

// ─── Members ─────────────────────────────────────────────────

export async function addMember(req: AuthRequest, res: Response) {
  const member = await teamService.addMember(req.params.id as string, req.user!.userId, req.body);
  res.status(201).json({ success: true, data: member });
}

export async function updateMemberRole(req: AuthRequest, res: Response) {
  const member = await teamService.updateMemberRole(
    req.params.id as string,
    req.user!.userId,
    req.params.memberId as string,
    req.body.role,
  );
  res.json({ success: true, data: member });
}

export async function removeMember(req: AuthRequest, res: Response) {
  await teamService.removeMember(req.params.id as string, req.user!.userId, req.params.memberId as string);
  res.json({ success: true, message: 'Member removed' });
}

// ─── Workflows ───────────────────────────────────────────────

export async function createWorkflow(req: AuthRequest, res: Response) {
  const workflow = await teamService.createWorkflow(req.params.id as string, req.user!.userId, req.body);
  res.status(201).json({ success: true, data: workflow });
}

export async function getWorkflows(req: AuthRequest, res: Response) {
  const workflows = await teamService.getWorkflows(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: workflows });
}

export async function updateWorkflow(req: AuthRequest, res: Response) {
  const workflow = await teamService.updateWorkflow(
    req.params.workflowId as string,
    req.user!.userId,
    req.body,
  );
  res.json({ success: true, data: workflow });
}

export async function deleteWorkflow(req: AuthRequest, res: Response) {
  await teamService.deleteWorkflow(req.params.workflowId as string, req.user!.userId);
  res.json({ success: true, message: 'Workflow deleted' });
}

// ─── Approval Actions ────────────────────────────────────────

export async function submitForApproval(req: AuthRequest, res: Response) {
  const post = await teamService.submitForApproval(
    req.params.postId as string,
    req.user!.userId,
    req.body.teamId,
  );
  res.json({ success: true, data: post });
}

export async function approvePost(req: AuthRequest, res: Response) {
  const post = await teamService.approvePost(req.params.postId as string, req.user!.userId, req.body.comment);
  res.json({ success: true, data: post });
}

export async function requestChanges(req: AuthRequest, res: Response) {
  const post = await teamService.requestChanges(req.params.postId as string, req.user!.userId, req.body.comment);
  res.json({ success: true, data: post });
}

export async function rejectPost(req: AuthRequest, res: Response) {
  const post = await teamService.rejectPost(req.params.postId as string, req.user!.userId, req.body.comment);
  res.json({ success: true, data: post });
}

// ─── Comments ────────────────────────────────────────────────

export async function addPostComment(req: AuthRequest, res: Response) {
  const comment = await teamService.addPostComment(req.params.postId as string, req.user!.userId, req.body);
  res.status(201).json({ success: true, data: comment });
}

export async function getPostComments(req: AuthRequest, res: Response) {
  const comments = await teamService.getPostComments(req.params.postId as string);
  res.json({ success: true, data: comments });
}

// ─── Team Calendar ───────────────────────────────────────────

export async function getTeamCalendar(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const posts = await teamService.getTeamCalendar(req.params.id as string, req.user!.userId, month, year);
  res.json({ success: true, data: posts });
}
