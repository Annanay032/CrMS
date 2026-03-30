import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma, env, redis } from '../config/index.js';
import type { Role } from '../types/enums.js';

const INVITE_EXPIRY_HOURS = 72;
const RATE_LIMIT_KEY = 'invite:rate:';
const MAX_INVITES_PER_HOUR = 10;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createInvite(adminId: string, email: string, role: Role) {
  // ── Rate limit: max 10 invites per hour per admin ──
  const rateKey = `${RATE_LIMIT_KEY}${adminId}`;
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, 3600);
  if (count > MAX_INVITES_PER_HOUR) {
    throw Object.assign(new Error('Rate limit exceeded. Max 10 invites per hour.'), { statusCode: 429 });
  }

  // ── Check if email already registered ──
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
  }

  // ── Revoke any existing pending invites for same email ──
  await prisma.invite.updateMany({
    where: { email, status: 'PENDING' },
    data: { status: 'REVOKED' },
  });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      invitedById: adminId,
    },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const inviteUrl = `${env.CLIENT_URL}/register?invite=${token}`;

  return { ...invite, inviteUrl };
}

export async function validateInvite(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invite) {
    throw Object.assign(new Error('Invalid invite token'), { statusCode: 404 });
  }

  if (invite.status !== 'PENDING') {
    throw Object.assign(new Error(`Invite has already been ${invite.status.toLowerCase()}`), { statusCode: 410 });
  }

  if (new Date() > invite.expiresAt) {
    await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
    throw Object.assign(new Error('Invite has expired'), { statusCode: 410 });
  }

  return invite;
}

export async function acceptInvite(token: string, name: string, password: string) {
  const invite = await validateInvite(token);

  // ── Double-check email not taken (race condition guard) ──
  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        passwordHash,
        name,
        role: invite.role,
        ...(invite.role === 'CREATOR' ? { creatorProfile: { create: { niche: [], languages: ['en'] } } } : {}),
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedById: undefined },
    }),
  ]);

  // Update invite with the created user's ID
  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedById: user.id },
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function listInvites(page: number, limit: number, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as any } : {};

  // ── Auto-expire stale invites ──
  await prisma.invite.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  const [invites, total] = await Promise.all([
    prisma.invite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invite.count({ where }),
  ]);

  return { invites, total };
}

export async function revokeInvite(inviteId: string, adminId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });

  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
  }

  if (invite.status !== 'PENDING') {
    throw Object.assign(new Error('Only pending invites can be revoked'), { statusCode: 400 });
  }

  return prisma.invite.update({
    where: { id: inviteId },
    data: { status: 'REVOKED' },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });
}
