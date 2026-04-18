'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const activeView = useUIStore((s) => s.activeView);
  const teamId = useAuthStore((s) => s.activeTeamId);
  const { team } = useTeam();
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Mark messages as read when task is selected
  useEffect(() => {
    if (selectedTaskId && teamId) {
      api(`/teams/${teamId}/tasks/${selectedTaskId}/messages/mark-read`, { method: 'POST' })
        .then(() => qc.invalidateQueries({ queryKey: ['message-counts', teamId] }))
        .catch(() => {});
    }
  }, [selectedTaskId, teamId, qc]);

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

    // Determine which order field and grouping to use based on active view
    type OrderField = 'pipelineOrder' | 'energyOrder' | 'priorityOrder' | 'kanbanOrder' | 'groupOrder';
    let orderField: OrderField = 'pipelineOrder';
    let groupFn: (t: Task) => string = (t) => t.pipelineSection;

    if (activeView === 'energy') {
      orderField = 'energyOrder';
      groupFn = (t) => t.energy ?? 'untagged';
    } else if (activeView === 'priority') {
      orderField = 'priorityOrder';
      groupFn = (t) => t.importance ?? 'untagged';
    } else if (activeView === 'kanban') {
      orderField = 'kanbanOrder';
      groupFn = (t) => t.status === 'completed' ? 'done' : t.pipelineSection === 'active' ? 'in-progress' : 'todo';
    } else if (activeView === 'group') {
      orderField = 'groupOrder';
      groupFn = (t) => t.groupId;
    }

    const taskGroup = groupFn(task);
    const sectionTasks = pipelineTasks
      .filter((t) => groupFn(t) === taskGroup && t.status === 'active')
      .sort((a, b) => a[orderField].localeCompare(b[orderField]));

    const idx = sectionTasks.findIndex((t) => t._id === task._id);
    if (idx === -1) return;

    let newOrder: string;
    if (direction === 'up' && idx > 0) {
      const prev = idx > 1 ? sectionTasks[idx - 2][orderField] : null;
      newOrder = generateKeyBetween(prev, sectionTasks[idx - 1][orderField]);
    } else if (direction === 'down' && idx < sectionTasks.length - 1) {
      const next = idx < sectionTasks.length - 2 ? sectionTasks[idx + 2][orderField] : null;
      newOrder = generateKeyBetween(sectionTasks[idx + 1][orderField], next);
    } else {
      return;
    }

    api(`/teams/${teamId}/tasks/${task._id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ [orderField]: newOrder }),
    }).then(() => {
      qc.invalidateQueries({ queryKey: ['tasks', teamId] });
      qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
    });
  }, [task, pipelineTasks, teamId, qc, activeView]);

  // Empty state — desktop only
  if (!selectedTaskId) {
    return (
      <div className="hidden md:flex w-1/2 bg-bg-surface border-l border-border items-center justify-center shrink-0">
        <p className="text-text-tertiary text-[12px] font-mono">Select a task</p>
      </div>
    );
  }

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task?.title) {
      handleUpdate(task!._id, { title: trimmed });
    }
    setEditingTitle(false);
  };

  const content = !task ? (
    <p className="text-text-tertiary text-[12px] font-mono p-4">Loading...</p>
  ) : (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-border-subtle flex items-start justify-between gap-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="flex-1 text-[15px] md:text-[14px] text-text font-medium bg-transparent border-b border-accent outline-none py-0"
          />
        ) : (
          <h2
            className="text-[15px] md:text-[14px] text-text font-medium leading-snug flex-1 cursor-text hover:text-accent transition-colors"
            onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
          >
            {task.title}
          </h2>
        )}
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
      <div className="hidden md:flex w-1/2 bg-bg-surface border-l border-border flex-col shrink-0 overflow-hidden">
        {content}
      </div>

      {/* Mobile: full screen */}
      <div className="md:hidden fixed inset-0 z-50 bg-bg-surface flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle shrink-0">
          <button
            onClick={() => selectTask(null)}
            className="font-mono text-[13px] text-text-secondary hover:text-text"
          >
            &#9664; Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {content}
        </div>
      </div>
    </>
  );
}
