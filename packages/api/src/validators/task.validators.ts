import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  groupId: z.string(),
  notes: z.string().optional(),
  pipelineSection: z.enum(['active', 'queued', 'waiting', 'someday']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  energy: z.enum(['quick', 'deep', 'people', 'hands-on']).nullable().optional(),
  importance: z.enum(['urgent-important', 'important', 'urgent', 'neither']).nullable().optional(),
  assignees: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'deleted']).optional(),
  pipelineSection: z.enum(['active', 'queued', 'waiting', 'someday']).optional(),
  pipelineOrder: z.string().optional(),
  energyOrder: z.string().optional(),
  priorityOrder: z.string().optional(),
  kanbanOrder: z.string().optional(),
  groupOrder: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  energy: z.enum(['quick', 'deep', 'people', 'hands-on']).nullable().optional(),
  importance: z.enum(['urgent-important', 'important', 'urgent', 'neither']).nullable().optional(),
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
  energyOrder: z.string().optional(),
  priorityOrder: z.string().optional(),
  kanbanOrder: z.string().optional(),
  groupOrder: z.string().optional(),
  pipelineSection: z.enum(['active', 'queued', 'waiting', 'someday']).optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});
