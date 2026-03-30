import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, env, redis, logger } from '../config/index.js';
import type { JwtPayload } from '../types/common.js';
import type { Role } from '../types/enums.js';

const REFRESH_PREFIX = 'refresh:';

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as unknown as number });
}

function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload }, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number });
}

export async function register(email: string, password: string, name: string, role: Role, inviteCode?: string) {
  // ADMIN registration requires a valid invite code
  if (role === 'ADMIN') {
    const adminCode = env.ADMIN_INVITE_CODE || 'CRMS_ADMIN_2026';
    if (!inviteCode || inviteCode !== adminCode) {
      throw Object.assign(new Error('Invalid or missing admin invite code'), { statusCode: 403 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email, passwordHash, name, role,
      ...(role === 'CREATOR' ? { creatorProfile: { create: { niche: [], languages: ['en'] } } } : {}),
    },
  });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  if (!user.passwordHash) {
    throw Object.assign(
      new Error('This account uses Google sign-in. Please login with Google, or set a password in Settings > Profile.'),
      { statusCode: 401 },
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  if (!user.isActive) throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
}

export async function refreshTokens(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const stored = await redis.get(`${REFRESH_PREFIX}${payload.userId}`);
    if (stored !== token) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw Object.assign(new Error('User not found or deactivated'), { statusCode: 401 });
    }

    const newPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role };
    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }
    throw err;
  }
}

export async function logout(userId: string) {
  await redis.del(`${REFRESH_PREFIX}${userId}`);
  logger.info(`User ${userId} logged out`);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true, createdAt: true,
      passwordHash: true,
      creatorProfile: { include: { platformStats: true } },
      brandProfile: true,
      agencyProfile: { include: { creators: true } },
      teamMembers: {
        include: {
          team: {
            select: { id: true, name: true, avatarUrl: true, ownerId: true },
          },
        },
      },
      ownedTeams: {
        select: { id: true, name: true, avatarUrl: true, ownerId: true },
      },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const { passwordHash, teamMembers, ownedTeams, ...rest } = user;

  // Build a deduplicated list of teams with the user's role in each
  const teamMap = new Map<string, { id: string; name: string; avatarUrl: string | null; ownerId: string; teamRole: string }>();
  for (const owned of ownedTeams) {
    teamMap.set(owned.id, { ...owned, teamRole: 'OWNER' });
  }
  for (const tm of teamMembers) {
    if (!teamMap.has(tm.team.id)) {
      teamMap.set(tm.team.id, { ...tm.team, teamRole: tm.role });
    }
  }

  return {
    ...rest,
    hasPassword: !!passwordHash,
    teams: Array.from(teamMap.values()),
  };
}

export async function setPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  if (user.passwordHash) {
    throw Object.assign(new Error('Password already set. Use change-password instead.'), { statusCode: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function oauthLogin(user: { id: string; email: string; role: string }) {
  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
  return { accessToken, refreshToken };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent - don't reveal if email exists
  // TODO: In production, send actual email with reset token
  // For now, log the intent
  logger.info(`Password reset requested for ${email}`);
}

export async function getMyTeams(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true, name: true, avatarUrl: true, ownerId: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    avatarUrl: m.team.avatarUrl,
    ownerId: m.team.ownerId,
    memberCount: m.team._count.members,
    teamRole: m.role,
    isOwner: m.team.ownerId === userId,
  }));
}
