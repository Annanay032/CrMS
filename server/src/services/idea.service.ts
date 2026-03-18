import { prisma } from '../config/index.js';
import type { IdeaStatus } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

// ─── Ideas ──────────────────────────────────────────────────

export async function createIdea(creatorProfileId: string, data: {
  title: string;
  body?: string;
  status?: IdeaStatus;
  source?: string;
  mediaUrls?: string[];
  tagIds?: string[];
}) {
  const { tagIds, ...rest } = data;
  return prisma.contentIdea.create({
    data: {
      creatorProfileId,
      ...rest,
      mediaUrls: rest.mediaUrls ?? [],
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });
}

export async function updateIdea(ideaId: string, creatorProfileId: string, data: Partial<{
  title: string;
  body: string;
  status: IdeaStatus;
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
    include: { tags: { include: { tag: true } } },
  });
}

export async function deleteIdea(ideaId: string, creatorProfileId: string) {
  return prisma.contentIdea.delete({
    where: { id: ideaId, creatorProfileId },
  });
}

export async function getIdeas(creatorProfileId: string, filters: {
  status?: IdeaStatus;
  tagId?: string;
  page?: number;
  limit?: number;
}) {
  const { skip, take } = paginate(filters.page ?? 1, filters.limit ?? 50);

  const where: Record<string, unknown> = { creatorProfileId };
  if (filters.status) where.status = filters.status;
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };

  const [ideas, total] = await Promise.all([
    prisma.contentIdea.findMany({
      where,
      skip,
      take,
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.contentIdea.count({ where }),
  ]);

  return { ideas, total };
}

export async function getIdeaById(ideaId: string, creatorProfileId: string) {
  return prisma.contentIdea.findFirst({
    where: { id: ideaId, creatorProfileId },
    include: { tags: { include: { tag: true } } },
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
