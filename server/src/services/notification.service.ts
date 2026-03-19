import { prisma } from '../config/index.js';
import { emitToUser } from '../config/websocket.js';
import { orchestrator, type AgentEvent } from '../agents/orchestrator.js';
import { logger } from '../config/logger.js';
import type { NotificationType } from '@prisma/client';

// ─── CRUD ──────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: data ? (data as any) : undefined },
  });

  // Push over websocket
  emitToUser(userId, 'notification', notification);
  return notification;
}

export async function getNotifications(
  userId: string,
  opts: { unreadOnly?: boolean; page?: number; limit?: number } = {},
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 30, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (opts.unreadOnly) where.read = false;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return { items, total, unreadCount, page, limit };
}

export async function markRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(userId: string, id: string) {
  return prisma.notification.deleteMany({ where: { id, userId } });
}

// ─── Wire orchestrator events → notifications ──────────────

export function wireOrchestratorEvents(): void {
  orchestrator.on('agent:completed', (evt: AgentEvent) => {
    createNotification(
      evt.userId,
      'AGENT_COMPLETED',
      'Agent completed',
      `${evt.agentType.replace(/_/g, ' ')} finished successfully.`,
      { agentType: evt.agentType, taskId: evt.taskId },
    ).catch((err) => logger.error('Failed to create agent-completed notification', err));
  });

  orchestrator.on('agent:failed', (evt: AgentEvent) => {
    createNotification(
      evt.userId,
      'AGENT_FAILED',
      'Agent failed',
      `${evt.agentType.replace(/_/g, ' ')} encountered an error.`,
      { agentType: evt.agentType, error: (evt.data as Record<string, unknown>)?.error },
    ).catch((err) => logger.error('Failed to create agent-failed notification', err));
  });

  orchestrator.on('workflow:completed', (evt: AgentEvent) => {
    createNotification(
      evt.userId,
      'AGENT_COMPLETED',
      'Workflow completed',
      `Multi-step pipeline finished successfully.`,
      evt.data as Record<string, unknown>,
    ).catch((err) => logger.error('Failed to create workflow-completed notification', err));
  });

  logger.info('Orchestrator event → notification bridge active');
}
