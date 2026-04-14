'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useGroups } from '@/hooks/useGroups';
import { api } from '@/lib/api';
import type { Task } from '@/types';

export default function TrashPage() {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const { groups } = useGroups();
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['trash', teamId],
    queryFn: () => api<{ tasks: Task[] }>(`/teams/${teamId}/trash`).then((d) => d.tasks),
    enabled: !!teamId,
  });

  const restore = useMutation({
    mutationFn: (taskId: string) =>
      api(`/teams/${teamId}/trash/${taskId}/restore`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash', teamId] });
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    },
  });

  const permanentDelete = useMutation({
    mutationFn: (taskId: string) =>
      api(`/teams/${teamId}/trash/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash', teamId] }),
  });

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9249;</span> Trash
        </h1>
        <p className="text-[12px] text-text-tertiary mt-1">Deleted tasks are permanently removed after 30 days.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-4 pb-10">
        {isLoading ? (
          <p className="text-text-tertiary font-mono text-sm">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <span className="text-[32px] mb-3 opacity-30">&#9249;</span>
            <p className="text-[13px]">Trash is empty</p>
          </div>
        ) : (
          <div className="list-none">
            {tasks.map((t) => {
              const group = groups.find((g) => g._id === t.groupId);
              const deletedAgo = t.deletedAt
                ? Math.floor((Date.now() - new Date(t.deletedAt).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              return (
                <div
                  key={t._id}
                  className="flex items-center gap-2.5 px-2 py-[7px] rounded hover:bg-bg-hover transition-colors"
                >
                  <span className="flex-1 text-[13px] text-text-tertiary line-through">{t.title}</span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {group && (
                      <span className="font-mono text-[10px] tracking-wide px-[7px] py-[2px] rounded-[3px] bg-bg-active text-text-tertiary">
                        {group.name}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-text-tertiary opacity-60">
                      {deletedAgo}d ago
                    </span>
                    <button
                      onClick={() => restore.mutate(t._id)}
                      className="font-mono text-[11px] text-green hover:text-accent transition-colors px-1.5"
                    >
                      restore
                    </button>
                    <button
                      onClick={() => permanentDelete.mutate(t._id)}
                      className="font-mono text-[11px] text-text-tertiary hover:text-red transition-colors px-1.5"
                    >
                      delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
