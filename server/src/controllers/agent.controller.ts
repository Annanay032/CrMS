import type { Response } from 'express';
import { orchestrator } from '../agents/orchestrator.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';
import type { AgentType } from '../types/enums.js';

/** Return true if the error was handled (response sent). */
function handleAiError(err: unknown, res: Response): boolean {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('API key') || message.includes('authentication') || message.includes('401')) {
    res.status(503).json({ success: false, error: 'AI service is not configured. Please set a valid OPENAI_API_KEY.' });
    return true;
  }
  if (message.includes('quota') || message.includes('exceeded') || message.includes('billing') || message.includes('429')) {
    res.status(503).json({ success: false, error: 'AI service quota exceeded. Please check your OpenAI plan and billing details.' });
    return true;
  }
  if (message.includes('does not exist') || message.includes('model')) {
    res.status(503).json({ success: false, error: `AI model error: ${message}` });
    return true;
  }
  return false;
}

export async function runAgent(req: AuthRequest, res: Response) {
  try {
    const { agentType, input } = req.body as { agentType: AgentType; input: Record<string, unknown> };
    const result = await orchestrator.run(agentType, req.user!.userId, input);
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function generateContent(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('CONTENT_GENERATION' as AgentType, req.user!.userId, req.body);
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function optimizeSchedule(req: AuthRequest, res: Response) {
  try {
    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!creatorProfile) {
      res.status(404).json({ success: false, error: 'Creator profile not found' });
      return;
    }
    const result = await orchestrator.run(
      'SCHEDULING' as AgentType,
      req.user!.userId,
      { ...req.body, creatorProfileId: creatorProfile.id },
    );
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function getAnalyticsInsights(req: AuthRequest, res: Response) {
  try {
    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!creatorProfile) {
      res.status(404).json({ success: false, error: 'Creator profile not found' });
      return;
    }
    const result = await orchestrator.run(
      'ANALYTICS' as AgentType,
      req.user!.userId,
      { ...req.body, creatorProfileId: creatorProfile.id },
    );
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function getEngagementSuggestions(req: AuthRequest, res: Response) {
  try {
    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!creatorProfile) {
      res.status(404).json({ success: false, error: 'Creator profile not found' });
      return;
    }
    const result = await orchestrator.run(
      'ENGAGEMENT' as AgentType,
      req.user!.userId,
      { ...req.body, creatorProfileId: creatorProfile.id },
    );
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function getTrends(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run(
      'TREND_DETECTION' as AgentType,
      req.user!.userId,
      req.body,
    );
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function listAgents(_req: AuthRequest, res: Response) {
  const agents = orchestrator.listAgents();
  res.json({ success: true, data: agents });
}

export async function getAgentHistory(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (req.query.agentType) where.agentType = req.query.agentType;

  const [tasks, total] = await Promise.all([
    prisma.agentTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentTask.count({ where }),
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * Chat endpoint: server-side NLP routing → single or multi-agent pipeline.
 */
export async function chat(req: AuthRequest, res: Response) {
  const { message } = req.body as { message: string };
  const userId = req.user!.userId;

  const { steps, input } = orchestrator.routeMessage(message);

  if (steps.length === 1) {
    const result = await orchestrator.run(steps[0].agentType as AgentType, userId, {
      ...input,
      ...(steps[0].action ? { action: steps[0].action } : {}),
    });
    res.json({
      success: true,
      data: {
        mode: 'single',
        agentType: steps[0].agentType,
        output: result.output,
        tokensUsed: result.tokensUsed,
      },
    });
    return;
  }

  // Multi-step pipeline
  const results = await orchestrator.runPipeline(userId, steps, input);
  res.json({
    success: true,
    data: {
      mode: 'pipeline',
      steps: results.map((r, i) => ({
        agentType: steps[i].agentType,
        output: r.output,
        tokensUsed: r.tokensUsed,
      })),
    },
  });
}

// ─── Growth Copilot endpoints ────────────────────────────────

async function getCreatorProfileForGrowth(userId: string) {
  return prisma.creatorProfile.findUnique({
    where: { userId },
    include: { platformStats: true },
  });
}

export async function growthDaily(req: AuthRequest, res: Response) {
  try {
    const profile = await getCreatorProfileForGrowth(req.user!.userId);
    if (!profile) { res.status(404).json({ success: false, error: 'Creator profile not found' }); return; }
    const result = await orchestrator.run('GROWTH' as AgentType, req.user!.userId, {
      action: 'daily',
      creatorProfileId: profile.id,
      niche: profile.niche,
      platforms: profile.platformStats.map(ps => ps.platform),
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function growthHooks(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('GROWTH' as AgentType, req.user!.userId, {
      action: 'hooks',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function growthPredict(req: AuthRequest, res: Response) {
  try {
    const result = await orchestrator.run('GROWTH' as AgentType, req.user!.userId, {
      action: 'predict',
      ...req.body,
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}

export async function growthWeeklyPlan(req: AuthRequest, res: Response) {
  try {
    const profile = await getCreatorProfileForGrowth(req.user!.userId);
    if (!profile) { res.status(404).json({ success: false, error: 'Creator profile not found' }); return; }
    const result = await orchestrator.run('GROWTH' as AgentType, req.user!.userId, {
      action: 'weekly_plan',
      creatorProfileId: profile.id,
      niche: profile.niche,
      platforms: profile.platformStats.map(ps => ps.platform),
    });
    res.json({ success: true, data: result.output });
  } catch (err) {
    if (!handleAiError(err, res)) throw err;
  }
}
