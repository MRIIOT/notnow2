import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  groupId: z.string(),
  notes: z.string().optional(),
  pipelineSection: z.enum(['above', 'below', 'waiting', 'someday']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignees: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'deleted']).optional(),
  cancelReason: z.string().optional(),
  pipelineSection: z.enum(['above', 'below', 'waiting', 'someday']).optional(),
  pipelineOrder: z.string().optional(),
  groupOrder: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignees: z.array(z.string()).optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().optional(),
  archived: z.boolean().optional(),
});

export const reorderTaskSchema = z.object({
  pipelineOrder: z.string().optional(),
  groupOrder: z.string().optional(),
  pipelineSection: z.enum(['above', 'below', 'waiting', 'someday']).optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});
