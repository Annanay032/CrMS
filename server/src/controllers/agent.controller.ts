import type { Response } from 'express';
import { orchestrator } from '../agents/orchestrator.js';
import { prisma } from '../config/index.js';
import type { AuthRequest } from '../types/common.js';
import type { AgentType } from '../types/enums.js';

export async function runAgent(req: AuthRequest, res: Response) {
  const { agentType, input } = req.body as { agentType: AgentType; input: Record<string, unknown> };
  const result = await orchestrator.run(agentType, req.user!.userId, input);
  res.json({ success: true, data: result.output });
}

export async function generateContent(req: AuthRequest, res: Response) {
  const result = await orchestrator.run('CONTENT_GENERATION' as AgentType, req.user!.userId, req.body);
  res.json({ success: true, data: result.output });
}

export async function optimizeSchedule(req: AuthRequest, res: Response) {
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
}

export async function getAnalyticsInsights(req: AuthRequest, res: Response) {
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
}

export async function getEngagementSuggestions(req: AuthRequest, res: Response) {
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('API key') || message.includes('authentication') || message.includes('401')) {
      res.status(503).json({ success: false, error: 'AI service is not configured. Please set a valid OPENAI_API_KEY.' });
      return;
    }
    throw err;
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
