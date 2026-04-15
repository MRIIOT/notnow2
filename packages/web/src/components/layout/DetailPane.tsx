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

  // Empty state — desktop only (hidden on mobile when no task selected)
  if (!selectedTaskId) {
    return (
      <div className="hidden md:flex w-[380px] bg-bg-surface border-l border-border items-center justify-center shrink-0">
        <p className="text-text-tertiary text-[12px] font-mono">Select a task</p>
      </div>
    );
  }

  const content = !task ? (
    <p className="text-text-tertiary text-[12px] font-mono p-4">Loading...</p>
  ) : (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-border-subtle flex items-start justify-between gap-2">
        <h2 className="text-[14px] text-text font-medium leading-snug flex-1">{task.title}</h2>
        <button
          onClick={() => selectTask(null)}
          className="font-mono text-[12px] text-text-tertiary hover:text-text-secondary shrink-0 mt-0.5"
        >
          &#10005;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <TaskDetail task={task} members={team?.members} onUpdate={handleUpdate} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: right pane */}
      <div className="hidden md:flex w-[380px] bg-bg-surface border-l border-border flex-col shrink-0 overflow-hidden">
        {content}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col" style={{ maxHeight: '55vh' }}>
        <div
          className="flex-1 bg-black/40"
          onClick={() => selectTask(null)}
        />
        <div className="bg-bg-surface border-t border-border rounded-t-xl flex flex-col overflow-hidden" style={{ maxHeight: '55vh' }}>
          <div className="w-10 h-1 bg-border-subtle rounded-full mx-auto mt-2 mb-1 shrink-0" />
          {content}
        </div>
      </div>
    </>
  );
}
