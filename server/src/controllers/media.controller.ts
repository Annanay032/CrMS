import type { Response } from 'express';
import * as mediaService from '../services/media.service.js';
import { uploadMulterFile } from '../services/storage.service.js';
import type { AuthRequest } from '../types/common.js';

// ─── Folders ────────────────────────────────────────────────

export async function createFolder(req: AuthRequest, res: Response) {
  const { name, parentId } = req.body as { name: string; parentId?: string };
  const folder = await mediaService.createFolder(req.user!.userId, name, parentId);
  res.status(201).json({ success: true, data: folder });
}

export async function getFolders(req: AuthRequest, res: Response) {
  const parentId = req.query.parentId as string | undefined;
  const data = await mediaService.getFolders(req.user!.userId, parentId);
  res.json({ success: true, data });
}

export async function deleteFolder(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await mediaService.deleteFolder(req.user!.userId, id);
  res.json({ success: true });
}

// ─── Assets ─────────────────────────────────────────────────

export async function uploadAsset(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  // Upload to cloud storage (R2/S3) or keep local
  const { url } = await uploadMulterFile(file);

  const asset = await mediaService.createAsset({
    userId: req.user!.userId,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url,
    folderId: req.body.folderId || undefined,
    tags: req.body.tags ? JSON.parse(req.body.tags) : [],
  });

  res.status(201).json({ success: true, data: asset });
}

export async function getAssets(req: AuthRequest, res: Response) {
  const opts = {
    folderId: req.query.folderId as string | undefined,
    tag: req.query.tag as string | undefined,
    search: req.query.search as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 30,
  };
  const data = await mediaService.getAssets(req.user!.userId, opts);
  res.json({ success: true, data });
}

export async function updateAsset(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await mediaService.updateAsset(req.user!.userId, id, req.body);
  res.json({ success: true });
}

export async function deleteAsset(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await mediaService.deleteAsset(req.user!.userId, id);
  res.json({ success: true });
}
