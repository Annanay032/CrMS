import type { Response } from 'express';
import * as campaignService from '../services/campaign.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

export async function createCampaign(req: AuthRequest, res: Response) {
  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!brandProfile) {
    res.status(404).json({ success: false, error: 'Brand profile not found' });
    return;
  }
  const campaign = await campaignService.createCampaign(brandProfile.id, req.body);
  res.status(201).json({ success: true, data: campaign });
}

export async function getCampaign(req: AuthRequest, res: Response) {
  const campaign = await campaignService.getCampaign(req.params.id as string);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }
  res.json({ success: true, data: campaign });
}

export async function listCampaigns(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const brandProfileId = req.query.brandProfileId as string | undefined;
  const { campaigns, total } = await campaignService.listCampaigns(page, limit, { brandProfileId, status: status as any });
  res.json({
    success: true,
    data: campaigns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function updateCampaignStatus(req: AuthRequest, res: Response) {
  const campaign = await campaignService.updateCampaignStatus(req.params.id as string, req.body.status);
  res.json({ success: true, data: campaign });
}

export async function updateCampaignStage(req: AuthRequest, res: Response) {
  const campaign = await campaignService.updateCampaignStage(req.params.id as string, req.body.stage);
  res.json({ success: true, data: campaign });
}

export async function updateCampaign(req: AuthRequest, res: Response) {
  const campaign = await campaignService.updateCampaign(req.params.id as string, req.body);
  res.json({ success: true, data: campaign });
}

export async function respondToMatch(req: AuthRequest, res: Response) {
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!creatorProfile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }
  const match = await campaignService.respondToMatch(req.params.matchId as string, creatorProfile.id, req.body.accept);
  res.json({ success: true, data: match });
}

export async function getCreatorCampaigns(req: AuthRequest, res: Response) {
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!creatorProfile) {
    res.status(404).json({ success: false, error: 'Creator profile not found' });
    return;
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { matches, total } = await campaignService.getCreatorCampaigns(creatorProfile.id, page, limit);
  res.json({
    success: true,
    data: matches,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── Deliverables ────────────────────────────────────────────

export async function createDeliverable(req: AuthRequest, res: Response) {
  const deliverable = await campaignService.createDeliverable(req.params.id as string, req.body);
  res.status(201).json({ success: true, data: deliverable });
}

export async function updateDeliverable(req: AuthRequest, res: Response) {
  const deliverable = await campaignService.updateDeliverable(req.params.deliverableId as string, req.body);
  res.json({ success: true, data: deliverable });
}

export async function getDeliverables(req: AuthRequest, res: Response) {
  const deliverables = await campaignService.getDeliverables(req.params.id as string);
  res.json({ success: true, data: deliverables });
}

export async function deleteDeliverable(req: AuthRequest, res: Response) {
  await campaignService.deleteDeliverable(req.params.deliverableId as string);
  res.json({ success: true, message: 'Deliverable deleted' });
}

// ─── Reports ─────────────────────────────────────────────────

export async function getCampaignReports(req: AuthRequest, res: Response) {
  const reports = await campaignService.getCampaignReports(req.params.id as string);
  res.json({ success: true, data: reports });
}

// ─── Creator Discovery ──────────────────────────────────────

export async function discoverCreators(req: AuthRequest, res: Response) {
  const filters = {
    niche: req.query.niche as string | undefined,
    platform: req.query.platform as string | undefined,
    minFollowers: req.query.minFollowers ? Number(req.query.minFollowers) : undefined,
    minEngagement: req.query.minEngagement ? Number(req.query.minEngagement) : undefined,
    location: req.query.location as string | undefined,
    language: req.query.language as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  };
  const { creators, total } = await campaignService.discoverCreators(filters);
  res.json({
    success: true,
    data: creators,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  });
}
