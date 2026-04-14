import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().default('notnow-jwt-secret-dev'),
  JWT_REFRESH_SECRET: z.string().default('notnow-jwt-refresh-secret-dev'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
