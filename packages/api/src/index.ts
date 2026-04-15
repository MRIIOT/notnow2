import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start();
