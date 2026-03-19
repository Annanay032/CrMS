import { prisma } from '../config/index.js';

// ─── Folders ────────────────────────────────────────────────

export async function createFolder(userId: string, name: string, parentId?: string) {
  return prisma.mediaFolder.create({ data: { userId, name, parentId } });
}

export async function getFolders(userId: string, parentId?: string) {
  return prisma.mediaFolder.findMany({
    where: { userId, parentId: parentId ?? null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { assets: true, children: true } } },
  });
}

export async function deleteFolder(userId: string, id: string) {
  return prisma.mediaFolder.deleteMany({ where: { id, userId } });
}

// ─── Assets ─────────────────────────────────────────────────

export async function createAsset(data: {
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  tags?: string[];
  folderId?: string;
}) {
  return prisma.mediaAsset.create({ data });
}

export async function getAssets(
  userId: string,
  opts: { folderId?: string; tag?: string; search?: string; page?: number; limit?: number } = {},
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 30, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (opts.folderId) where.folderId = opts.folderId;
  if (opts.tag) where.tags = { has: opts.tag };
  if (opts.search) where.filename = { contains: opts.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.mediaAsset.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function updateAsset(userId: string, id: string, data: { tags?: string[]; folderId?: string | null; filename?: string }) {
  return prisma.mediaAsset.updateMany({ where: { id, userId }, data });
}

export async function deleteAsset(userId: string, id: string) {
  return prisma.mediaAsset.deleteMany({ where: { id, userId } });
}
