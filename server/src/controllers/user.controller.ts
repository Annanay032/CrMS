import type { Response } from 'express';
import * as userService from '../services/user.service.js';
import type { AuthRequest } from '../types/common.js';

export async function updateProfile(req: AuthRequest, res: Response) {
  const user = await userService.updateProfile(req.user!.userId, req.body);
  res.json({ success: true, data: user });
}

export async function setupCreatorProfile(req: AuthRequest, res: Response) {
  const profile = await userService.setupCreatorProfile(req.user!.userId, req.body);
  res.json({ success: true, data: profile });
}

export async function setupBrandProfile(req: AuthRequest, res: Response) {
  const profile = await userService.setupBrandProfile(req.user!.userId, req.body);
  res.json({ success: true, data: profile });
}

export async function setupAgencyProfile(req: AuthRequest, res: Response) {
  const profile = await userService.setupAgencyProfile(req.user!.userId, req.body);
  res.json({ success: true, data: profile });
}

export async function listUsers(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const role = req.query.role as string | undefined;
  const { users, total } = await userService.listUsers(page, limit, role as any);
  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  res.json({ success: true, data: user });
}

export async function toggleUserActive(req: AuthRequest, res: Response) {
  const user = await userService.toggleUserActive(req.params.id);
  res.json({ success: true, data: user });
}
