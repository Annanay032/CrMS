import type { Response } from 'express';
import * as revenueService from '../services/revenue.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

async function getCreatorProfileId(userId: string): Promise<string> {
  const profile = await prisma.creatorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, niche: [], languages: ['en'] },
  });
  return profile.id;
}

// ─── Revenue Streams ─────────────────────────────────────────

export async function createRevenueStream(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const stream = await revenueService.createRevenueStream(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: stream });
}

export async function listRevenueStreams(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { streams, total } = await revenueService.listRevenueStreams(creatorProfileId, page, limit, {
    type: req.query.type as string | undefined,
    period: req.query.period as string | undefined,
  });
  res.json({ success: true, data: streams, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function deleteRevenueStream(req: AuthRequest, res: Response) {
  await revenueService.deleteRevenueStream(req.params.id as string);
  res.json({ success: true, message: 'Revenue stream deleted' });
}

// ─── Brand Deals ─────────────────────────────────────────────

export async function createBrandDeal(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const deal = await revenueService.createBrandDeal(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: deal });
}

export async function listBrandDeals(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { deals, total } = await revenueService.listBrandDeals(creatorProfileId, page, limit, {
    status: req.query.status as string | undefined,
  });
  res.json({ success: true, data: deals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function updateBrandDeal(req: AuthRequest, res: Response) {
  const deal = await revenueService.updateBrandDeal(req.params.id as string, req.body);
  res.json({ success: true, data: deal });
}

export async function deleteBrandDeal(req: AuthRequest, res: Response) {
  await revenueService.deleteBrandDeal(req.params.id as string);
  res.json({ success: true, message: 'Brand deal deleted' });
}

// ─── Invoices ────────────────────────────────────────────────

export async function createInvoice(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const invoice = await revenueService.createInvoice(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: invoice });
}

export async function listInvoices(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { invoices, total } = await revenueService.listInvoices(creatorProfileId, page, limit, {
    status: req.query.status as string | undefined,
  });
  res.json({ success: true, data: invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function updateInvoice(req: AuthRequest, res: Response) {
  const invoice = await revenueService.updateInvoice(req.params.id as string, req.body);
  res.json({ success: true, data: invoice });
}

export async function deleteInvoice(req: AuthRequest, res: Response) {
  await revenueService.deleteInvoice(req.params.id as string);
  res.json({ success: true, message: 'Invoice deleted' });
}

// ─── Summaries ───────────────────────────────────────────────

export async function getRevenueSummary(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const period = req.query.period as string | undefined;
  const summary = await revenueService.getRevenueSummary(creatorProfileId, period);
  res.json({ success: true, data: summary });
}

export async function getPostROI(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const posts = await revenueService.getPostROI(creatorProfileId);
  res.json({ success: true, data: posts });
}
