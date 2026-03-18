import { Router } from 'express';
import { z } from 'zod';
import passport from 'passport';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  role: z.enum(['CREATOR', 'BRAND', 'AGENCY']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// Google OAuth routes
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
    async (req, res) => {
      try {
        const user = req.user as unknown as { userId: string; email: string; role: string };
        const tokens = await authService.oauthLogin({ id: user.userId, email: user.email, role: user.role });
        const params = new URLSearchParams({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        res.redirect(`${env.CLIENT_URL}/auth/callback?${params.toString()}`);
      } catch {
        res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
      }
    },
  );
} else {
  // Register fallback routes so the UI gets a clear error instead of a 404
  router.get('/google', (_req, res) => {
    res.status(501).json({ success: false, error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  });
  router.get('/google/callback', (_req, res) => {
    res.status(501).json({ success: false, error: 'Google OAuth is not configured.' });
  });
}

export default router;
