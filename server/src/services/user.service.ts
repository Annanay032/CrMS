import { prisma } from '../config/index.js';
import type { Prisma } from '@prisma/client';
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
  const payload = {
    ...data,
    targetAudience: data.targetAudience as Prisma.InputJsonValue | undefined,
  };
  return prisma.brandProfile.upsert({
    where: { userId },
    update: payload,
    create: { userId, ...payload },
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

export async function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true, createdAt: true },
  });
}

export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true, createdAt: true },
  });
}
