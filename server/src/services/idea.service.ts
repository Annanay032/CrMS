import { prisma } from '../config/index.js';
import type { IdeaStatus } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

// ─── Default stages seeded on first access ──────────────────

const DEFAULT_STAGES = [
  { name: 'Spark', color: '#fbbf24', position: 0 },
  { name: 'Developing', color: '#60a5fa', position: 1 },
  { name: 'Ready', color: '#34d399', position: 2 },
  { name: 'Archived', color: '#94a3b8', position: 3 },
];

export async function ensureDefaultStages(creatorProfileId: string) {
  const count = await prisma.ideaStage.count({ where: { creatorProfileId } });
  if (count === 0) {
    await prisma.ideaStage.createMany({
      data: DEFAULT_STAGES.map((s) => ({ creatorProfileId, ...s })),
    });
  }
}

// ─── Stages ─────────────────────────────────────────────────

export async function getStages(creatorProfileId: string) {
  await ensureDefaultStages(creatorProfileId);
  return prisma.ideaStage.findMany({
    where: { creatorProfileId },
    orderBy: { position: 'asc' },
    include: { _count: { select: { ideas: true } } },
  });
}

export async function createStage(creatorProfileId: string, data: {
  name: string;
  color?: string;
}) {
  const maxPos = await prisma.ideaStage.aggregate({
    where: { creatorProfileId },
    _max: { position: true },
  });
  return prisma.ideaStage.create({
    data: {
      creatorProfileId,
      name: data.name,
      color: data.color ?? '#6366f1',
      position: (maxPos._max.position ?? -1) + 1,
    },
  });
}

export async function updateStage(stageId: string, creatorProfileId: string, data: Partial<{
  name: string;
  color: string;
  position: number;
}>) {
  return prisma.ideaStage.update({
    where: { id: stageId, creatorProfileId },
    data,
  });
}

export async function reorderStages(creatorProfileId: string, stageIds: string[]) {
  await prisma.$transaction(
    stageIds.map((id, index) =>
      prisma.ideaStage.update({
        where: { id, creatorProfileId },
        data: { position: index },
      }),
    ),
  );
  return getStages(creatorProfileId);
}

export async function deleteStage(stageId: string, creatorProfileId: string, moveToStageId?: string) {
  if (moveToStageId) {
    await prisma.contentIdea.updateMany({
      where: { stageId, creatorProfileId },
      data: { stageId: moveToStageId },
    });
  } else {
    await prisma.contentIdea.updateMany({
      where: { stageId, creatorProfileId },
      data: { stageId: null },
    });
  }
  return prisma.ideaStage.delete({
    where: { id: stageId, creatorProfileId },
  });
}

// ─── Ideas ──────────────────────────────────────────────────

export async function createIdea(creatorProfileId: string, data: {
  title: string;
  body?: string;
  status?: IdeaStatus;
  stageId?: string;
  source?: string;
  mediaUrls?: string[];
  tagIds?: string[];
}) {
  const { tagIds, ...rest } = data;

  // Auto-assign to first stage if no stageId provided
  if (!rest.stageId) {
    const firstStage = await prisma.ideaStage.findFirst({
      where: { creatorProfileId },
      orderBy: { position: 'asc' },
    });
    if (firstStage) rest.stageId = firstStage.id;
  }

  return prisma.contentIdea.create({
    data: {
      creatorProfileId,
      ...rest,
      mediaUrls: rest.mediaUrls ?? [],
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } }, stage: true },
  });
}

export async function updateIdea(ideaId: string, creatorProfileId: string, data: Partial<{
  title: string;
  body: string;
  status: IdeaStatus;
  stageId: string;
  source: string;
  mediaUrls: string[];
  tagIds: string[];
}>) {
  const { tagIds, ...rest } = data;

  if (tagIds !== undefined) {
    await prisma.contentIdeaTag.deleteMany({ where: { ideaId } });
    if (tagIds.length > 0) {
      await prisma.contentIdeaTag.createMany({
        data: tagIds.map((tagId) => ({ ideaId, tagId })),
      });
    }
  }

  return prisma.contentIdea.update({
    where: { id: ideaId, creatorProfileId },
    data: rest,
    include: { tags: { include: { tag: true } }, stage: true },
  });
}

export async function deleteIdea(ideaId: string, creatorProfileId: string) {
  return prisma.contentIdea.delete({
    where: { id: ideaId, creatorProfileId },
  });
}

export async function getIdeas(creatorProfileId: string, filters: {
  status?: IdeaStatus;
  stageId?: string;
  tagId?: string;
  page?: number;
  limit?: number;
}) {
  const { skip, take } = paginate(filters.page ?? 1, filters.limit ?? 50);

  const where: Record<string, unknown> = { creatorProfileId };
  if (filters.status) where.status = filters.status;
  if (filters.stageId) where.stageId = filters.stageId;
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };

  const [ideas, total] = await Promise.all([
    prisma.contentIdea.findMany({
      where,
      skip,
      take,
      include: { tags: { include: { tag: true } }, stage: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.contentIdea.count({ where }),
  ]);

  return { ideas, total };
}

export async function getIdeaById(ideaId: string, creatorProfileId: string) {
  return prisma.contentIdea.findFirst({
    where: { id: ideaId, creatorProfileId },
    include: { tags: { include: { tag: true } }, stage: true },
  });
}

// ─── Tags ───────────────────────────────────────────────────

export async function createTag(creatorProfileId: string, data: { name: string; color?: string }) {
  return prisma.contentTag.create({
    data: { creatorProfileId, ...data },
  });
}

export async function getTags(creatorProfileId: string) {
  return prisma.contentTag.findMany({
    where: { creatorProfileId },
    orderBy: { name: 'asc' },
  });
}

export async function updateTag(tagId: string, creatorProfileId: string, data: Partial<{ name: string; color: string }>) {
  return prisma.contentTag.update({
    where: { id: tagId, creatorProfileId },
    data,
  });
}

export async function deleteTag(tagId: string, creatorProfileId: string) {
  return prisma.contentTag.delete({
    where: { id: tagId, creatorProfileId },
  });
}

// ─── Templates ──────────────────────────────────────────────

export async function getTemplates(userId?: string) {
  return prisma.contentTemplate.findMany({
    where: {
      OR: [
        { isGlobal: true },
        ...(userId ? [{ userId }] : []),
      ],
    },
    orderBy: { category: 'asc' },
  });
}

export async function createTemplate(userId: string, data: {
  name: string;
  body: string;
  platform?: string;
  category: string;
}) {
  return prisma.contentTemplate.create({
    data: { ...data, platform: data.platform as any, userId, isGlobal: false },
  });
}
