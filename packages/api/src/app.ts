import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import trashRoutes from './routes/trash.routes.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/teams/:teamId/groups', groupsRoutes);
app.use('/api/v1/teams/:teamId/tasks', tasksRoutes);
app.use('/api/v1/teams/:teamId/trash', trashRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
