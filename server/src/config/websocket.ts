import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { logger } from './logger.js';
import type { JwtPayload } from '../types/common.js';

let io: Server | null = null;

export function setupWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    path: '/ws',
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as Socket & { userId?: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket & { userId?: string }) => {
    const userId = socket.userId;
    if (!userId) { socket.disconnect(); return; }

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);
    logger.info(`WS connected: user ${userId} (${socket.id})`);

    socket.on('disconnect', () => {
      logger.debug(`WS disconnected: user ${userId} (${socket.id})`);
    });
  });

  logger.info('WebSocket server initialised');
  return io;
}

/** Get the Socket.IO server instance (safe to call before setup — returns null). */
export function getIO(): Server | null {
  return io;
}

/** Send an event to a specific user. */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}
