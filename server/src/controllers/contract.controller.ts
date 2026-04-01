import type { Response } from 'express';
import * as contractService from '../services/contract.service.js';
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

export async function createContract(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const contract = await contractService.createContract(creatorProfileId, req.body);
  res.status(201).json({ success: true, data: contract });
}

export async function listContracts(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { contracts, total } = await contractService.listContracts(creatorProfileId, page, limit, {
    status: req.query.status as string | undefined,
  });
  res.json({ success: true, data: contracts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getContract(req: AuthRequest, res: Response) {
  const contract = await contractService.getContractById(req.params.id as string);
  if (!contract) { res.status(404).json({ success: false, error: 'Contract not found' }); return; }
  res.json({ success: true, data: contract });
}

export async function updateContract(req: AuthRequest, res: Response) {
  const contract = await contractService.updateContract(req.params.id as string, req.body);
  res.json({ success: true, data: contract });
}

export async function deleteContract(req: AuthRequest, res: Response) {
  await contractService.deleteContract(req.params.id as string);
  res.json({ success: true, message: 'Contract deleted' });
}

export async function getCalendarEvents(req: AuthRequest, res: Response) {
  const creatorProfileId = await getCreatorProfileId(req.user!.userId);
  const events = await contractService.getContractCalendarEvents(creatorProfileId);
  res.json({ success: true, data: events });
}
