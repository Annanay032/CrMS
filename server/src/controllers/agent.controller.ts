import type { Response } from 'express';
import { orchestrator } from '../agents/orchestrator.js';
import { prisma, openai } from '../config/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { AuthRequest } from '../types/common.js';
import { AgentType } from '../types/enums.js';
import { gatherUserContext } from '../services/context.service.js';
import { checkBudget, recordUsage } from '../services/usage.service.js';

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

export async function getAdminAgentHistory(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (req.query.agentType) where.agentType = req.query.agentType;
  if (req.query.userId) where.userId = req.query.userId;

  const [tasks, total] = await Promise.all([
    prisma.agentTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
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
 * Chat endpoint: context-aware AI chat with full user data.
 * Makes a single OpenAI call with comprehensive user context injected
 * into the system prompt, replacing the old keyword-routing approach.
 */
export async function chat(req: AuthRequest, res: Response) {
  const { message, history } = req.body as {
    message: string;
    history?: Array<{ role: 'user' | 'ai'; content: string }>;
  };
  const userId = req.user!.userId;

  try {
    await checkBudget(userId);

    const userContext = await gatherUserContext(userId);

    const systemPrompt = `You are CrMS AI — an expert social media management assistant. You have access to the user's real-time data below. Use it to give data-backed, actionable answers.

When the user asks about their performance, analytics, growth, revenue, content, or strategy, reference their actual numbers. Be specific with data points. Format responses with markdown for readability.

If the user asks you to generate content (captions, ideas, hooks, hashtags), create high-quality, platform-optimized content.

If you don't have enough data to answer, say so honestly and suggest what data would help.

---
${userContext}
---

Guidelines:
- Be concise but thorough
- Use bullet points and headers for clarity
- Reference actual metrics when available
- Give actionable recommendations
- For content generation, optimize for the user's niche and platforms`;

    // Build conversation messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Include conversation history (last 10 messages max)
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 2000,
    });

    const output = response.choices[0]?.message?.content ?? 'I could not generate a response.';
    const tokensUsed = response.usage?.total_tokens;

    // Record usage
    if (tokensUsed) {
      await recordUsage(userId, AgentType.CONTENT_GENERATION, tokensUsed, env.OPENAI_MODEL).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        mode: 'single' as const,
        agentType: 'CHAT',
        output,
        tokensUsed,
      },
    });
  } catch (err) {
    logger.error('Chat endpoint error', err);
    if (!handleAiError(err, res)) throw err;
  }
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
