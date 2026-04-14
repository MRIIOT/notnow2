'use client';

import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useTeam } from '@/hooks/useTeam';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import type { Task } from '@/types';

export function DetailPane() {
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const selectTask = useUIStore((s) => s.selectTask);
  const teamId = useAuthStore((s) => s.activeTeamId);
  const { team } = useTeam();
  const qc = useQueryClient();

  const { data: task } = useQuery({
    queryKey: ['task', teamId, selectedTaskId],
    queryFn: () =>
      api<{ task: Task }>(`/teams/${teamId}/tasks/${selectedTaskId}`).then((d) => d.task),
    enabled: !!teamId && !!selectedTaskId,
  });

  const handleUpdate = (taskId: string, data: Partial<Task>) => {
    api(`/teams/${teamId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(() => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['task', teamId, taskId] });
    });
  };

  if (!selectedTaskId) {
    return (
      <div className="w-[380px] bg-bg-surface border-l border-border flex items-center justify-center shrink-0">
        <p className="text-text-tertiary text-[12px] font-mono">Select a task</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="w-[380px] bg-bg-surface border-l border-border flex items-center justify-center shrink-0">
        <p className="text-text-tertiary text-[12px] font-mono">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-subtle flex items-start justify-between gap-2">
        <h2 className="text-[14px] text-text font-medium leading-snug flex-1">{task.title}</h2>
        <button
          onClick={() => selectTask(null)}
          className="font-mono text-[12px] text-text-tertiary hover:text-text-secondary shrink-0 mt-0.5"
        >
          &#10005;
        </button>
      </div>

      {/* Scrollable detail */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <TaskDetail task={task} members={team?.members} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
