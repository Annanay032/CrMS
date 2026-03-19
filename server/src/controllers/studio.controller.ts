import type { Response } from 'express';
import { orchestrator } from '../agents/orchestrator.js';
import * as integrationHub from '../services/integration-hub.service.js';
import type { AuthRequest } from '../types/common.js';
import type { AgentType } from '../types/enums.js';

/** Return true if the error was handled (response sent). */
function handleError(err: unknown, res: Response): boolean {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('not configured')) {
    res.status(503).json({ success: false, error: message });
    return true;
  }
  if (message.includes('API key') || message.includes('401')) {
    res.status(503).json({ success: false, error: 'External service not configured.' });
    return true;
  }
  return false;
}

/** AI-driven compose — generates a full post draft from a topic */
export async function compose(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'compose',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** AI rewrite — takes existing caption and rewrites with intent */
export async function rewrite(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'rewrite',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** Generate an image via OpenAI DALL-E */
export async function generateImage(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'image_gen',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** Suggest media prompts based on caption */
export async function suggestMedia(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'suggest_media',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** Get status of all external integrations */
export async function integrations(_req: AuthRequest, res: Response) {
  const statuses = integrationHub.getIntegrationStatuses();
  res.json({ success: true, data: { integrations: statuses } });
}

/** Intelligence — best times, hashtags, content score, tips */
export async function intelligence(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'intelligence',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** Video analysis — retention, rewatch hotspots, engagement */
export async function videoAnalysis(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'video_analysis',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}

/** Create clips / shorts from long-form video */
export async function createClip(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('STUDIO' as AgentType, req.user!.userId, {
      action: 'create_clip',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleError(err, res)) throw err;
  }
}
