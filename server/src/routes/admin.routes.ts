import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { Role } from '../types/enums.js';
import { validate } from '../middleware/validate.js';
import * as inviteService from '../services/invite.service.js';
import type { AuthRequest } from '../types/common.js';
import type { Response } from 'express';

const router = Router();

// ── System Stats ────────────────────────────────────────────
router.get('/stats', authenticate, authorize(Role.ADMIN), async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    totalTeams,
    totalPosts,
    totalAgentTasks,
    roleCounts,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.team.count(),
    prisma.contentPost.count(),
    prisma.agentTask.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const roles = Object.fromEntries(roleCounts.map((r) => [r.role, r._count]));

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalTeams,
      totalPosts,
      totalAgentTasks,
      roles,
      recentUsers,
    },
  });
});

// ── Invites (ADMIN only) ────────────────────────────────────

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CREATOR', 'BRAND', 'AGENCY', 'ADMIN']),
});

router.post('/invites', authenticate, authorize(Role.ADMIN), validate(createInviteSchema), async (req: AuthRequest, res: Response) => {
  const invite = await inviteService.createInvite(req.user!.userId, req.body.email, req.body.role);
  res.status(201).json({ success: true, data: invite });
});

router.get('/invites', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const status = req.query.status as string | undefined;
  const { invites, total } = await inviteService.listInvites(page, limit, status);
  res.json({
    success: true,
    data: invites,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.delete('/invites/:id', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  const invite = await inviteService.revokeInvite(req.params.id, req.user!.userId);
  res.json({ success: true, data: invite });
});

// ── Public: validate & accept invite ────────────────────────

router.get('/invites/validate/:token', async (req, res) => {
  const invite = await inviteService.validateInvite(req.params.token);
  res.json({
    success: true,
    data: {
      email: invite.email,
      role: invite.role,
      invitedBy: invite.invitedBy,
      expiresAt: invite.expiresAt,
    },
  });
});

const acceptInviteSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

router.post('/invites/accept/:token', validate(acceptInviteSchema), async (req, res) => {
  const user = await inviteService.acceptInvite(req.params.token, req.body.name, req.body.password);
  res.json({ success: true, data: user });
});

export default router;
