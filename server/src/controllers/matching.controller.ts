import type { Response } from 'express';
import * as matchingService from '../matching/matching.service.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';

export async function findCreators(req: AuthRequest, res: Response) {
  const { campaignId } = req.body;
  const result = await matchingService.findCreatorsForCampaign(campaignId, req.user!.userId);
  res.json({ success: true, data: result.output });
}

export async function getMatchResults(req: AuthRequest, res: Response) {
  const matches = await matchingService.getMatchResults(req.params.campaignId);
  res.json({ success: true, data: matches });
}

export async function discoverCreators(req: AuthRequest, res: Response) {
  const filters = {
    niche: req.query.niche ? (req.query.niche as string).split(',') : undefined,
    platform: req.query.platform as string | undefined,
    minFollowers: req.query.minFollowers ? Number(req.query.minFollowers) : undefined,
    maxFollowers: req.query.maxFollowers ? Number(req.query.maxFollowers) : undefined,
    minEngagement: req.query.minEngagement ? Number(req.query.minEngagement) : undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  };
  const result = await matchingService.discoverCreators(filters);
  res.json({
    success: true,
    data: result.creators,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}
