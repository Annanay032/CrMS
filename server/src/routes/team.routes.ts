import { Router } from 'express';
import { z } from 'zod';
import * as teamController from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// ─── Schemas ─────────────────────────────────────────────────

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER']),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER']),
});

const workflowStageSchema = z.object({
  name: z.string().min(1),
  approverRoles: z.array(z.enum(['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR'])).min(1),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  stages: z.array(workflowStageSchema).min(1),
  isDefault: z.boolean().optional(),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  stages: z.array(workflowStageSchema).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const submitApprovalSchema = z.object({
  teamId: z.string().min(1),
});

const approvalActionSchema = z.object({
  comment: z.string().max(2000).optional(),
});

const commentSchema = z.object({
  body: z.string().min(1).max(5000),
  isApproval: z.boolean().optional(),
  approvalAction: z.enum(['approve', 'request_changes', 'reject']).optional(),
});

// ─── Team CRUD ───────────────────────────────────────────────

router.post('/', authenticate, validate(createTeamSchema), teamController.createTeam);
router.get('/', authenticate, teamController.getMyTeams);
router.get('/:id', authenticate, teamController.getTeam);
router.put('/:id', authenticate, validate(updateTeamSchema), teamController.updateTeam);
router.delete('/:id', authenticate, teamController.deleteTeam);

// ─── Members ─────────────────────────────────────────────────

router.post('/:id/members', authenticate, validate(addMemberSchema), teamController.addMember);
router.put('/:id/members/:memberId', authenticate, validate(updateMemberRoleSchema), teamController.updateMemberRole);
router.delete('/:id/members/:memberId', authenticate, teamController.removeMember);

// ─── Workflows ───────────────────────────────────────────────

router.post('/:id/workflows', authenticate, validate(createWorkflowSchema), teamController.createWorkflow);
router.get('/:id/workflows', authenticate, teamController.getWorkflows);
router.put('/:id/workflows/:workflowId', authenticate, validate(updateWorkflowSchema), teamController.updateWorkflow);
router.delete('/:id/workflows/:workflowId', authenticate, teamController.deleteWorkflow);

// ─── Team Calendar ───────────────────────────────────────────

router.get('/:id/calendar', authenticate, teamController.getTeamCalendar);

// ─── Approval Actions ────────────────────────────────────────

router.post('/posts/:postId/submit', authenticate, validate(submitApprovalSchema), teamController.submitForApproval);
router.post('/posts/:postId/approve', authenticate, validate(approvalActionSchema), teamController.approvePost);
router.post('/posts/:postId/request-changes', authenticate, validate(approvalActionSchema), teamController.requestChanges);
router.post('/posts/:postId/reject', authenticate, validate(approvalActionSchema), teamController.rejectPost);

// ─── Post Comments ───────────────────────────────────────────

router.post('/posts/:postId/comments', authenticate, validate(commentSchema), teamController.addPostComment);
router.get('/posts/:postId/comments', authenticate, teamController.getPostComments);

export default router;
