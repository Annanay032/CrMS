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
