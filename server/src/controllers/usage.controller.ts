import type { Response } from 'express';
import * as usageService from '../services/usage.service.js';
import type { AuthRequest } from '../types/common.js';

export async function getUsageSummary(req: AuthRequest, res: Response) {
  const data = await usageService.getUsageSummary(req.user!.userId);
  res.json({ success: true, data });
}

export async function getUsageHistory(req: AuthRequest, res: Response) {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await usageService.getUsageHistory(req.user!.userId, days);
  res.json({ success: true, data });
}
