import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import type { IncomingMessage, ServerResponse } from 'http';

let connected = false;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!connected) {
    await connectDB();
    connected = true;
  }
  return app(req as any, res as any);
}
