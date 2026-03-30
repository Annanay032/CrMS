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
  role: z.enum(['CREATOR', 'BRAND', 'AGENCY', 'ADMIN']),
  inviteCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const setPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/my-teams', authenticate, authController.getMyTeams);
router.put('/set-password', authenticate, validate(setPasswordSchema), authController.setPassword);

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

// Microsoft OAuth routes
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  router.get('/microsoft', passport.authenticate('microsoft', { session: false }));

  router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
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
  router.get('/microsoft', (_req, res) => {
    res.status(501).json({ success: false, error: 'Microsoft OAuth is not configured.' });
  });
  router.get('/microsoft/callback', (_req, res) => {
    res.status(501).json({ success: false, error: 'Microsoft OAuth is not configured.' });
  });
}

// Okta / Company SSO routes
if (env.OKTA_ISSUER && env.OKTA_CLIENT_ID && env.OKTA_CLIENT_SECRET) {
  router.get('/okta', passport.authenticate('okta', { session: false }));

  router.get(
    '/okta/callback',
    passport.authenticate('okta', { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
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
  router.get('/okta', (_req, res) => {
    res.status(501).json({ success: false, error: 'Okta SSO is not configured. Set OKTA_ISSUER, OKTA_CLIENT_ID, and OKTA_CLIENT_SECRET.' });
  });
  router.get('/okta/callback', (_req, res) => {
    res.status(501).json({ success: false, error: 'Okta SSO is not configured.' });
  });
}

export default router;
