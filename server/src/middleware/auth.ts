import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import type { AuthRequest, JwtPayload } from '../types/common.js';
import type { Role } from '../types/enums.js';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * Middleware that checks the user's TeamRole in the team specified by
 * header `X-Team-Id` or param `:teamId`. Requires `authenticate` first.
 */
export function requireTeamRole(...allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // System ADMIN bypasses team role checks
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const teamId = (req.headers['x-team-id'] as string) || req.params.teamId;
    if (!teamId) {
      res.status(400).json({ success: false, error: 'Team context required (X-Team-Id header or :teamId param)' });
      return;
    }

    try {
      const member = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: req.user.userId } },
      });

      if (!member) {
        res.status(403).json({ success: false, error: 'Not a member of this team' });
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
        res.status(403).json({ success: false, error: `Requires team role: ${allowedRoles.join(' or ')}` });
        return;
      }

      // Attach team context
      (req as any).teamRole = member.role;
      (req as any).teamId = teamId;
      next();
    } catch {
      res.status(500).json({ success: false, error: 'Team role check failed' });
    }
  };
}
