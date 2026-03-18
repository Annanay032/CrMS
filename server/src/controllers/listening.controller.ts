import type { Response } from 'express';
import * as listeningService from '../services/listening.service.js';
import type { AuthRequest } from '../types/common.js';

export async function createQuery(req: AuthRequest, res: Response) {
  const query = await listeningService.createQuery(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: query });
}

export async function getQueries(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const { queries, total, page: safePage, limit } = await listeningService.getQueries(req.user!.userId, page);
  res.json({
    success: true,
    data: queries,
    pagination: { page: safePage, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getQueryById(req: AuthRequest, res: Response) {
  const query = await listeningService.getQueryById(req.params.id as string, req.user!.userId);
  if (!query) { res.status(404).json({ success: false, error: 'Query not found' }); return; }
  res.json({ success: true, data: query });
}

export async function updateQuery(req: AuthRequest, res: Response) {
  const query = await listeningService.updateQuery(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data: query });
}

export async function deleteQuery(req: AuthRequest, res: Response) {
  await listeningService.deleteQuery(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Query deleted' });
}

export async function getMentions(req: AuthRequest, res: Response) {
  const filters = {
    platform: req.query.platform as string | undefined,
    sentiment: req.query.sentiment as string | undefined,
    page: Number(req.query.page) || 1,
  };
  const { mentions, total, page, limit } = await listeningService.getMentions(req.params.id as string, req.user!.userId, filters);
  res.json({
    success: true,
    data: mentions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getSentimentTimeline(req: AuthRequest, res: Response) {
  const days = Number(req.query.days) || 30;
  const timeline = await listeningService.getSentimentTimeline(req.params.id as string, req.user!.userId, days);
  res.json({ success: true, data: timeline });
}

export async function getSentimentSummary(req: AuthRequest, res: Response) {
  const summary = await listeningService.getSentimentSummary(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: summary });
}
