import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { AuthRequest } from '../types/common.js';

export async function register(req: Request, res: Response) {
  const { email, password, name, role } = req.body;
  const result = await authService.register(email, password, name, role);
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
