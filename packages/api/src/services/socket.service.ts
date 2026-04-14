import type { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/authenticate.js';

export function setupSocketIO(io: SocketServer) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthPayload;
    console.log(`Socket connected: @${user.username}`);

    // Client joins team rooms
    socket.on('join-team', (teamId: string) => {
      socket.join(`team:${teamId}`);
    });

    socket.on('leave-team', (teamId: string) => {
      socket.leave(`team:${teamId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: @${user.username}`);
    });
  });
}

/**
 * Emit a team event to all connected clients in that team room.
 * Call from route handlers via req.app.locals.io
 */
export function emitTeamEvent(
  io: SocketServer,
  teamId: string,
  event: string,
  data: unknown,
) {
  io.to(`team:${teamId}`).emit(event, data);
}
