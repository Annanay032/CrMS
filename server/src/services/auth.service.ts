import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, env, redis, logger } from '../config/index.js';
import type { JwtPayload } from '../types/common.js';
import type { Role } from '../types/enums.js';

const REFRESH_PREFIX = 'refresh:';

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export async function register(email: string, password: string, name: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
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
      id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true,
      creatorProfile: { include: { platformStats: true } },
      brandProfile: true,
      agencyProfile: { include: { creators: true } },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}
