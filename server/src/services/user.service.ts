import { prisma } from '../config/index.js';
import type { Role } from '../types/enums.js';
import { paginate } from '../utils/helpers.js';

export async function updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });
}

export async function setupCreatorProfile(userId: string, data: {
  bio?: string;
  niche: string[];
  location?: string;
  languages?: string[];
  portfolioUrl?: string;
}) {
  return prisma.creatorProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
    include: { platformStats: true },
  });
}

export async function setupBrandProfile(userId: string, data: {
  companyName: string;
  industry?: string;
  website?: string;
  targetAudience?: Record<string, unknown>;
  budgetRangeLow?: number;
  budgetRangeHigh?: number;
}) {
  return prisma.brandProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function setupAgencyProfile(userId: string, data: {
  agencyName: string;
  website?: string;
}) {
  return prisma.agencyProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function listUsers(page: number, limit: number, role?: Role) {
  const { skip, take } = paginate(page, limit);
  const where = role ? { role } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}
