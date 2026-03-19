import { Router } from 'express';
import { z } from 'zod';
import * as cloudImportController from '../controllers/cloud-import.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requirePlan } from '../middleware/plan-gate.js';

const router = Router();
router.use(authenticate, requirePlan('PRO'));

const googleDriveSchema = z.object({
  files: z.array(z.object({
    fileId: z.string().min(1),
    accessToken: z.string().min(1),
  })).min(1).max(20),
});

const dropboxSchema = z.object({
  files: z.array(z.object({
    url: z.string().url(),
    name: z.string().min(1),
    bytes: z.number().int().min(0),
  })).min(1).max(20),
});

const canvaSchema = z.object({
  exportUrl: z.string().url(),
  title: z.string().min(1).max(200),
});

router.post('/google-drive', validate(googleDriveSchema), cloudImportController.importFromGoogleDrive);
router.post('/dropbox', validate(dropboxSchema), cloudImportController.importFromDropbox);
router.post('/canva', validate(canvaSchema), cloudImportController.importFromCanva);

export default router;
