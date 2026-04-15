import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import tasksRoutes from './routes/tasks.routes.js';

import trashRoutes from './routes/trash.routes.js';
import { setupSocketIO } from './services/socket.service.js';
import { startReminderChecker } from './services/reminder.service.js';
import notificationsRoutes from './routes/notifications.routes.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

// Make io available to routes via app.locals
app.locals.io = io;

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/teams/:teamId/groups', groupsRoutes);
app.use('/api/v1/teams/:teamId/tasks', tasksRoutes);

app.use('/api/v1/teams/:teamId/trash', trashRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

setupSocketIO(io);

async function start() {
  await connectDB();
  startReminderChecker(io);
  httpServer.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start();
