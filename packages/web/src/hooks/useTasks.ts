'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Task } from '@/types';

export function useTasks(view: string, groupId?: string) {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();

  const queryKey = ['tasks', teamId, view, groupId];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({ view });
      if (groupId) params.set('groupId', groupId);
      return api<{ tasks: Task[] }>(`/teams/${teamId}/tasks?${params}`).then((d) => d.tasks);
    },
    enabled: !!teamId,
  });

  const createTask = useMutation({
    mutationFn: (data: { title: string; groupId: string }) =>
      api<{ task: Task }>(`/teams/${teamId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['groups', teamId] });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Partial<Task>) =>
      api<{ task: Task }>(`/teams/${teamId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ taskId, ...data }) => {
      // Optimistic update: apply changes immediately
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Task[]>(queryKey);
      if (prev) {
        qc.setQueryData<Task[]>(queryKey, prev.map((t) =>
          t._id === taskId ? { ...t, ...data, ...(data.status === 'completed' ? { completedAt: new Date().toISOString() } : {}) } : t
        ));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', teamId] }),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      api(`/teams/${teamId}/tasks/${taskId}`, { method: 'DELETE' }),
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Task[]>(queryKey);
      if (prev) {
        qc.setQueryData<Task[]>(queryKey, prev.filter((t) => t._id !== taskId));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['groups', teamId] });
    },
  });

  const reorderTask = useMutation({
    mutationFn: ({
      taskId,
      ...data
    }: {
      taskId: string;
      pipelineOrder?: string;
      groupOrder?: string;
      pipelineSection?: string;
    }) =>
      api(`/teams/${teamId}/tasks/${taskId}/reorder`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ taskId, ...data }) => {
      // Optimistic: move task to new position immediately
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Task[]>(queryKey);
      if (prev) {
        qc.setQueryData<Task[]>(queryKey, (prev.map((t) =>
          t._id === taskId ? { ...t, ...data } as Task : t
        ) as Task[]).sort((a, b) => {
          // Sort by section then by the relevant order field
          if (view === 'group') return a.groupOrder.localeCompare(b.groupOrder);
          const sectionOrder = { above: 0, below: 1, waiting: 2, someday: 3 };
          const sa = sectionOrder[a.pipelineSection as keyof typeof sectionOrder] ?? 0;
          const sb = sectionOrder[b.pipelineSection as keyof typeof sectionOrder] ?? 0;
          if (sa !== sb) return sa - sb;
          return a.pipelineOrder.localeCompare(b.pipelineOrder);
        }));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', teamId] }),
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
  };
}
