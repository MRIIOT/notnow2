import { z } from 'zod';

export const createTeamSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  displayName: z.string().min(1).max(100),
});

export const addMemberSchema = z.object({
  username: z.string().min(1),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']).optional(),
});
