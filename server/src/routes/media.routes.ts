import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import * as ctrl from '../controllers/media.controller.js';
import { authenticate } from '../middleware/auth.js';
import { env } from '../config/env.js';

const storage = multer.diskStorage({
  destination: env.UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
});

const router = Router();

// Folders
router.get('/folders', authenticate, ctrl.getFolders);
router.post('/folders', authenticate, ctrl.createFolder);
router.delete('/folders/:id', authenticate, ctrl.deleteFolder);

// Assets
router.get('/assets', authenticate, ctrl.getAssets);
router.post('/assets', authenticate, upload.single('file'), ctrl.uploadAsset);
router.patch('/assets/:id', authenticate, ctrl.updateAsset);
router.delete('/assets/:id', authenticate, ctrl.deleteAsset);

export default router;
