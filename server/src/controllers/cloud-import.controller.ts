import type { Response } from 'express';
import * as cloudImportService from '../services/cloud-import.service.js';
import type { AuthRequest } from '../types/common.js';

export async function importFromGoogleDrive(req: AuthRequest, res: Response) {
  const { files } = req.body as { files: Array<{ fileId: string; accessToken: string }> };
  const results = await cloudImportService.importFromGoogleDrive(req.user!.userId, files);
  res.json({ success: true, data: results });
}

export async function importFromDropbox(req: AuthRequest, res: Response) {
  const { files } = req.body as { files: Array<{ url: string; name: string; bytes: number }> };
  const results = await cloudImportService.importFromDropbox(req.user!.userId, files);
  res.json({ success: true, data: results });
}

export async function importFromCanva(req: AuthRequest, res: Response) {
  const { exportUrl, title } = req.body as { exportUrl: string; title: string };
  const result = await cloudImportService.importFromCanva(req.user!.userId, { exportUrl, title });
  if (!result) {
    res.status(500).json({ success: false, error: 'Canva import failed' });
    return;
  }
  res.json({ success: true, data: result });
}
