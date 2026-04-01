import type { Response } from 'express';
import * as crmService from '../services/crm.service.js';
import type { AuthRequest } from '../types/common.js';

// ─── Contacts ────────────────────────────────────────────────

export async function createContact(req: AuthRequest, res: Response) {
  const contact = await crmService.createContact(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: contact });
}

export async function listContacts(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filters = {
    type: req.query.type as string | undefined,
    platform: req.query.platform as string | undefined,
    search: req.query.search as string | undefined,
    minScore: req.query.minScore ? Number(req.query.minScore) : undefined,
  };
  const { contacts, total } = await crmService.listContacts(req.user!.userId, page, limit, filters);
  const totalPages = Math.ceil(total / limit);
  res.json({ success: true, data: contacts, pagination: { page, limit, total, totalPages } });
}

export async function getContact(req: AuthRequest, res: Response) {
  const contact = await crmService.getContactById(req.params.id as string, req.user!.userId);
  if (!contact) { res.status(404).json({ success: false, error: 'Contact not found' }); return; }
  res.json({ success: true, data: contact });
}

export async function updateContact(req: AuthRequest, res: Response) {
  const contact = await crmService.updateContact(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data: contact });
}

export async function deleteContact(req: AuthRequest, res: Response) {
  await crmService.deleteContact(req.params.id as string, req.user!.userId);
  res.json({ success: true, message: 'Contact deleted' });
}

export async function updateContactTags(req: AuthRequest, res: Response) {
  const contact = await crmService.updateContactTags(req.params.id as string, req.user!.userId, req.body.tags);
  res.json({ success: true, data: contact });
}

// ─── Pipeline ────────────────────────────────────────────────

export async function getPipeline(req: AuthRequest, res: Response) {
  const profileId = req.query.profileId as string;
  if (!profileId) { res.status(400).json({ success: false, error: 'profileId required' }); return; }
  const data = await crmService.getPipeline(profileId);
  res.json({ success: true, data });
}

// ─── Signals ─────────────────────────────────────────────────

export async function listSignals(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filters = {
    type: req.query.type as string | undefined,
    status: req.query.status as string | undefined,
    minScore: req.query.minScore ? Number(req.query.minScore) : undefined,
  };
  const { signals, total } = await crmService.listSignals(req.user!.userId, page, limit, filters);
  const totalPages = Math.ceil(total / limit);
  res.json({ success: true, data: signals, pagination: { page, limit, total, totalPages } });
}

export async function getSignalSummary(req: AuthRequest, res: Response) {
  const summary = await crmService.getSignalSummary(req.user!.userId);
  res.json({ success: true, data: summary });
}

export async function updateSignalStatus(req: AuthRequest, res: Response) {
  const signal = await crmService.updateSignalStatus(req.params.id as string, req.user!.userId, req.body.status);
  res.json({ success: true, data: signal });
}
