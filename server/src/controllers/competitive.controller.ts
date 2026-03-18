import type { Response } from 'express';
import * as competitiveService from '../services/competitive.service.js';
import type { AuthRequest } from '../types/common.js';

export async function createCompetitor(req: AuthRequest, res: Response) {
  const competitor = await competitiveService.createCompetitor(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: competitor });
}

export async function getCompetitors(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const { competitors, total, page: safePage, limit } = await competitiveService.getCompetitors(req.user!.userId, page);
  res.json({
    success: true,
    data: competitors,
    pagination: { page: safePage, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCompetitorById(req: AuthRequest, res: Response) {
  const competitor = await competitiveService.getCompetitorById(req.params.id as string, req.user!.userId);
  if (!competitor) { res.status(404).json({ success: false, error: 'Competitor not found' }); return; }
  res.json({ success: true, data: competitor });
}

export async function updateCompetitor(req: AuthRequest, res: Response) {
  const competitor = await competitiveService.updateCompetitor(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data: competitor });
}

export async function deleteCompetitor(req: AuthRequest, res: Response) {
  await competitiveService.deleteCompetitor(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Competitor deleted' });
}

export async function getSnapshots(req: AuthRequest, res: Response) {
  const platform = req.query.platform as string | undefined;
  const days = Number(req.query.days) || 30;
  const snapshots = await competitiveService.getCompetitorSnapshots(req.params.id as string, req.user!.userId, platform, days);
  res.json({ success: true, data: snapshots });
}

export async function getBenchmark(req: AuthRequest, res: Response) {
  const platform = req.query.platform as string || 'INSTAGRAM';
  const data = await competitiveService.getBenchmarkData(req.user!.userId, platform);
  res.json({ success: true, data });
}
