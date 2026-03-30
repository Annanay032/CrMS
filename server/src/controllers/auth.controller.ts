import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { AuthRequest } from '../types/common.js';

export async function register(req: Request, res: Response) {
  const { email, password, name, role, inviteCode } = req.body;
  const result = await authService.register(email, password, name, role, inviteCode);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  res.json({ success: true, data: result });
}

export async function logout(req: AuthRequest, res: Response) {
  if (req.user) await authService.logout(req.user.userId);
  res.json({ success: true, message: 'Logged out' });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await authService.getMe(req.user!.userId);
  res.json({ success: true, data: user });
}

export async function setPassword(req: AuthRequest, res: Response) {
  await authService.setPassword(req.user!.userId, req.body.password);
  res.json({ success: true, message: 'Password set successfully. You can now login with email and password.' });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.json({ success: true, message: 'If that email exists, a password reset link has been sent.' });
}

export async function getMyTeams(req: AuthRequest, res: Response) {
  const teams = await authService.getMyTeams(req.user!.userId);
  res.json({ success: true, data: teams });
}
