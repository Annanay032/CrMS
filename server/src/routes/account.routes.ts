import { Router } from 'express';
import { z } from 'zod';
import * as accountController from '../controllers/account.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const manualConnectSchema = z.object({
  handle: z.string().min(1).max(100),
  accessToken: z.string().max(2000).optional(),
});

// List connected accounts + available platforms
router.get('/', authenticate, accountController.getConnectedAccounts);

// Initiate platform OAuth flow (returns redirect URL)
router.get('/connect/:platform', authenticate, accountController.initiateOAuth);

// OAuth callback (platform redirects here — no auth middleware since user isn't logged in via Bearer in redirect)
router.get('/callback/:platform', accountController.handleCallback);

// Manual connect (for dev or platforms without OAuth)
router.post('/connect/:platform/manual', authenticate, validate(manualConnectSchema), accountController.manualConnect);

// Disconnect a platform
router.delete('/:provider', authenticate, accountController.disconnectAccount);

// Refresh a platform's token
router.post('/:provider/refresh', authenticate, accountController.refreshToken);

// Pause / resume a platform
router.patch('/:provider/pause', authenticate, accountController.togglePause);

export default router;
