import type { Response } from 'express';
import * as accountService from '../services/account.service.js';
import { env } from '../config/env.js';
import type { AuthRequest } from '../types/common.js';
import type { OAuthProvider } from '../types/enums.js';

export async function getConnectedAccounts(req: AuthRequest, res: Response) {
  const accounts = await accountService.getConnectedAccounts(req.user!.userId);
  const platforms = accountService.getAvailablePlatforms();
  res.json({ success: true, data: { accounts, platforms } });
}

export async function initiateOAuth(req: AuthRequest, res: Response) {
  const provider = (req.params.platform as string).toUpperCase();
  const url = accountService.getOAuthUrl(provider, req.user!.userId);

  if (!url) {
    res.status(400).json({
      success: false,
      error: `OAuth not configured for ${provider}. Use manual connect instead.`,
    });
    return;
  }

  res.json({ success: true, data: { url } });
}

export async function handleCallback(req: AuthRequest, res: Response) {
  const provider = (req.params.platform as string).toUpperCase();
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    res.redirect(`${env.CLIENT_URL}/settings?error=missing_params`);
    return;
  }

  try {
    await accountService.handleOAuthCallback(provider, code, state);
    res.redirect(`${env.CLIENT_URL}/settings?connected=${provider.toLowerCase()}`);
  } catch {
    res.redirect(`${env.CLIENT_URL}/settings?error=connection_failed&platform=${provider.toLowerCase()}`);
  }
}

export async function manualConnect(req: AuthRequest, res: Response) {
  const provider = (req.params.platform as string).toUpperCase() as OAuthProvider;
  const { handle, accessToken } = req.body as { handle: string; accessToken?: string };

  const account = await accountService.manualConnect(
    req.user!.userId,
    provider,
    handle,
    accessToken,
  );

  res.json({ success: true, data: account });
}

export async function disconnectAccount(req: AuthRequest, res: Response) {
  const provider = (req.params.provider as string).toUpperCase() as OAuthProvider;
  const result = await accountService.disconnectAccount(req.user!.userId, provider);
  res.json({ success: true, data: result });
}

export async function refreshToken(req: AuthRequest, res: Response) {
  const provider = (req.params.provider as string).toUpperCase() as OAuthProvider;
  const result = await accountService.refreshAccountToken(req.user!.userId, provider);
  res.json({ success: true, data: result });
}
