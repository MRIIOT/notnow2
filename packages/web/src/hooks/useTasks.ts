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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', teamId] }),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      api(`/teams/${teamId}/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['groups', teamId] });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}
