'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Task } from '@/types';

export function useTaskCounts() {
  const teamId = useAuthStore((s) => s.activeTeamId);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', teamId, 'pipeline'],
    queryFn: () =>
      api<{ tasks: Task[] }>(`/teams/${teamId}/tasks?view=pipeline`).then((d) => d.tasks),
    enabled: !!teamId,
  });

  const countByGroup: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status === 'active') {
      countByGroup[t.groupId] = (countByGroup[t.groupId] || 0) + 1;
    }
  }

  return countByGroup;
}
