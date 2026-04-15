'use client';

import { useRef, useState, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useTeam } from '@/hooks/useTeam';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { generateKeyBetween } from '@/lib/ordering';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import type { Task } from '@/types';

export function DetailPane() {
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const selectTask = useUIStore((s) => s.selectTask);
  const teamId = useAuthStore((s) => s.activeTeamId);
  const { team } = useTeam();
  const qc = useQueryClient();

  // Swipe-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    setDragY(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setDragY(dy);
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragY > 80) selectTask(null);
    setDragY(0);
  }, [dragY, selectTask]);

  const { data: task } = useQuery({
    queryKey: ['task', teamId, selectedTaskId],
    queryFn: () =>
      api<{ task: Task }>(`/teams/${teamId}/tasks/${selectedTaskId}`).then((d) => d.task),
    enabled: !!teamId && !!selectedTaskId,
  });

  // Get sibling tasks for reorder (pipeline view tasks in same section)
  const { data: pipelineTasks } = useQuery({
    queryKey: ['tasks', teamId, 'pipeline', undefined],
    queryFn: () =>
      api<{ tasks: Task[] }>(`/teams/${teamId}/tasks?view=pipeline`).then((d) => d.tasks),
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

  const handleMove = useCallback((direction: 'up' | 'down') => {
    if (!task || !pipelineTasks || !teamId) return;

    const sectionTasks = pipelineTasks
      .filter((t) => t.pipelineSection === task.pipelineSection && t.status === 'active')
      .sort((a, b) => a.pipelineOrder.localeCompare(b.pipelineOrder));

    const idx = sectionTasks.findIndex((t) => t._id === task._id);
    if (idx === -1) return;

    let newOrder: string;
    if (direction === 'up' && idx > 0) {
      const prev = idx > 1 ? sectionTasks[idx - 2].pipelineOrder : null;
      newOrder = generateKeyBetween(prev, sectionTasks[idx - 1].pipelineOrder);
    } else if (direction === 'down' && idx < sectionTasks.length - 1) {
      const next = idx < sectionTasks.length - 2 ? sectionTasks[idx + 2].pipelineOrder : null;
      newOrder = generateKeyBetween(sectionTasks[idx + 1].pipelineOrder, next);
    } else {
      return;
    }

    api(`/teams/${teamId}/tasks/${task._id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ pipelineOrder: newOrder }),
    }).then(() => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
    });
  }, [task, pipelineTasks, teamId, qc]);

  // Empty state — desktop only
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
      <div className="px-4 pt-2 md:pt-4 pb-3 border-b border-border-subtle flex items-start justify-between gap-2">
        <h2 className="text-[15px] md:text-[14px] text-text font-medium leading-snug flex-1">{task.title}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleMove('up')}
            className="font-mono text-[14px] text-text-tertiary hover:text-text-secondary px-1.5 py-0.5 rounded hover:bg-bg-hover transition-all"
            title="Move up"
          >
            &#9650;
          </button>
          <button
            onClick={() => handleMove('down')}
            className="font-mono text-[14px] text-text-tertiary hover:text-text-secondary px-1.5 py-0.5 rounded hover:bg-bg-hover transition-all"
            title="Move down"
          >
            &#9660;
          </button>
          <button
            onClick={() => selectTask(null)}
            className="font-mono text-[12px] text-text-tertiary hover:text-text-secondary shrink-0 px-1.5 py-0.5 rounded hover:bg-bg-hover transition-all hidden md:block"
          >
            &#10005;
          </button>
        </div>
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
      <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
        <div
          className="flex-1 bg-black/40"
          onClick={() => selectTask(null)}
        />
        <div
          className="bg-bg-surface border-t border-border rounded-t-xl flex flex-col overflow-hidden"
          style={{
            maxHeight: '60vh',
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <div
            className="flex items-center justify-center py-3 cursor-grab touch-none shrink-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-10 h-1 bg-border-subtle rounded-full" />
          </div>
          {content}
        </div>
      </div>
    </>
  );
}
