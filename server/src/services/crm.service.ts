import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';

// ─── Contacts ────────────────────────────────────────────────

export async function createContact(userId: string, data: {
  name: string;
  handle?: string;
  platform?: string;
  email?: string;
  type?: string;
  source?: string;
  tags?: string[];
  avatarUrl?: string;
  notes?: string;
  sourceMentionId?: string;
}) {
  return prisma.contact.create({
    data: {
      userId,
      name: data.name,
      handle: data.handle,
      platform: data.platform as any,
      email: data.email,
      type: (data.type as any) ?? 'OTHER',
      source: (data.source as any) ?? 'MANUAL',
      tags: data.tags ?? [],
      avatarUrl: data.avatarUrl,
      notes: data.notes,
      sourceMentionId: data.sourceMentionId,
    },
    include: { brandDeals: true },
  });
}

export async function listContacts(userId: string, page: number, limit: number, filters?: {
  type?: string;
  platform?: string;
  search?: string;
  minScore?: number;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { userId };
  if (filters?.type) where.type = filters.type;
  if (filters?.platform) where.platform = filters.platform;
  if (filters?.minScore) where.relationshipScore = { gte: filters.minScore };
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { handle: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: where as any,
      include: {
        _count: { select: { brandDeals: true } },
      },
      orderBy: { relationshipScore: 'desc' },
      skip,
      take,
    }),
    prisma.contact.count({ where: where as any }),
  ]);
  return { contacts, total };
}

export async function getContactById(id: string, userId: string) {
  return prisma.contact.findFirst({
    where: { id, userId },
    include: {
      brandDeals: { include: { invoices: true }, orderBy: { updatedAt: 'desc' } },
    },
  });
}

export async function updateContact(id: string, userId: string, data: {
  name?: string;
  handle?: string;
  platform?: string;
  email?: string;
  type?: string;
  tags?: string[];
  avatarUrl?: string;
  notes?: string;
}) {
  return prisma.contact.update({
    where: { id, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.handle !== undefined && { handle: data.handle }),
      ...(data.platform !== undefined && { platform: data.platform as any }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function deleteContact(id: string, userId: string) {
  return prisma.contact.delete({ where: { id, userId } });
}

export async function updateContactTags(id: string, userId: string, tags: string[]) {
  return prisma.contact.update({
    where: { id, userId },
    data: { tags },
  });
}

/** Recalculate relationship score based on interaction frequency, deal value, and recency */
export async function recalculateRelationshipScore(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { brandDeals: true },
  });
  if (!contact) return;

  // Deal value factor (0-40)
  const totalDealValue = contact.brandDeals.reduce((sum, d) => sum + d.dealValue, 0);
  const dealScore = Math.min(40, (totalDealValue / 100_000) * 40);

  // Deal count factor (0-30)
  const dealCountScore = Math.min(30, contact.brandDeals.length * 10);

  // Recency factor (0-30)
  let recencyScore = 0;
  if (contact.lastInteractionAt) {
    const daysSince = (Date.now() - contact.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24);
    recencyScore = Math.max(0, 30 - daysSince * 2);
  }

  const score = Math.round(Math.min(100, dealScore + dealCountScore + recencyScore));

  await prisma.contact.update({
    where: { id: contactId },
    data: { relationshipScore: score },
  });

  return score;
}

/** Find or create a contact from a mention author */
export async function findOrCreateFromMention(userId: string, mention: {
  source?: string | null;
  platform: string;
  content: string;
  id: string;
  authorFollowers?: number;
}) {
  // Check for existing contact by handle + platform
  if (mention.source) {
    const existing = await prisma.contact.findFirst({
      where: { userId, handle: mention.source, platform: mention.platform as any },
    });
    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { lastInteractionAt: new Date() },
      });
      return existing;
    }
  }

  return prisma.contact.create({
    data: {
      userId,
      name: mention.source ?? 'Unknown',
      handle: mention.source,
      platform: mention.platform as any,
      type: 'BRAND',
      source: 'MENTION',
      tags: [],
      sourceMentionId: mention.id,
      lastInteractionAt: new Date(),
    },
  });
}

// ─── Pipeline (Deals grouped by status) ─────────────────────

export async function getPipeline(creatorProfileId: string) {
  const deals = await prisma.brandDeal.findMany({
    where: { creatorProfileId },
    include: { contact: true, invoices: true },
    orderBy: { updatedAt: 'desc' },
  });

  // Group by status
  const pipeline: Record<string, typeof deals> = {};
  for (const deal of deals) {
    const status = deal.status;
    if (!pipeline[status]) pipeline[status] = [];
    pipeline[status].push(deal);
  }

  // Summary stats
  const totalValue = deals.reduce((sum, d) => sum + d.dealValue, 0);
  const weightedPipeline = deals.reduce((sum, d) => sum + (d.expectedValue ?? 0), 0);
  const wonDeals = deals.filter((d) => d.status === 'PAID' || d.status === 'DELIVERED');
  const wonValue = wonDeals.reduce((sum, d) => sum + d.dealValue, 0);

  return { pipeline, summary: { totalDeals: deals.length, totalValue, weightedPipeline, wonValue } };
}

// ─── Signals ─────────────────────────────────────────────────

export async function listSignals(userId: string, page: number, limit: number, filters?: {
  type?: string;
  status?: string;
  minScore?: number;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { userId };
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.minScore) where.opportunityScore = { gte: filters.minScore };

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where: where as any,
      include: { sourceMention: true },
      orderBy: { opportunityScore: 'desc' },
      skip,
      take,
    }),
    prisma.signal.count({ where: where as any }),
  ]);
  return { signals, total };
}

export async function getSignalSummary(userId: string) {
  const [byType, byStatus, highValue] = await Promise.all([
    prisma.signal.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.signal.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.signal.count({
      where: { userId, opportunityScore: { gte: 70 }, status: 'NEW' },
    }),
  ]);

  return {
    byType: Object.fromEntries(byType.map((r) => [r.type, r._count.id])),
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])),
    highValueCount: highValue,
  };
}

export async function updateSignalStatus(id: string, userId: string, status: string) {
  return prisma.signal.update({
    where: { id, userId },
    data: { status: status as any },
  });
}

export async function createSignal(userId: string, data: {
  type: string;
  title: string;
  description?: string;
  sourceMentionId?: string;
  opportunityScore: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.signal.create({
    data: {
      userId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      sourceMentionId: data.sourceMentionId,
      opportunityScore: data.opportunityScore,
      metadata: data.metadata as any,
    },
  });
}
