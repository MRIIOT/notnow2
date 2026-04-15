import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { setupSocketIO } from './services/socket.service.js';
import { startReminderChecker } from './services/reminder.service.js';
import app from './app.js';

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

app.locals.io = io;
setupSocketIO(io);

async function start() {
  await connectDB();
  startReminderChecker(io);
  httpServer.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start();
