import type { Response } from 'express';
import * as settingsService from '../services/settings.service.js';
import type { AuthRequest } from '../types/common.js';

export async function getSettings(req: AuthRequest, res: Response) {
  const data = await settingsService.getSettings(req.user!.userId);
  res.json({ success: true, data });
}

export async function updateSettings(req: AuthRequest, res: Response) {
  const data = await settingsService.updateSettings(req.user!.userId, req.body);
  res.json({ success: true, data });
}
