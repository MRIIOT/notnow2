'use client';

import { useEffect } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { Task, Group, TeamMember } from '@/types';
import { useUIStore } from '@/stores/uiStore';

interface TaskRowProps {
  task: Task;
  rank?: number;
  showGroup?: boolean;
  groups?: Group[];
  members?: TeamMember[];
  dragListeners?: SyntheticListenerMap;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskRow({ task, rank, showGroup, groups, members, dragListeners, onComplete, onDelete, onUpdate }: TaskRowProps) {
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const selectTask = useUIStore((s) => s.selectTask);

  const group = groups?.find((g) => g._id === task.groupId);
  const isCompleted = task.status === 'completed';
  const isSelected = selectedTaskId === task._id;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelected) selectTask(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, selectTask]);

  return (
    <li
      className={`flex items-center gap-2.5 rounded cursor-pointer transition-colors group relative px-2 py-[7px] ${
        isSelected ? 'bg-accent-dim' : 'hover:bg-bg-hover'
      }`}
      onClick={() => selectTask(isSelected ? null : task._id)}
    >
      <span
        className="text-text-tertiary opacity-0 group-hover:opacity-50 text-[11px] cursor-grab shrink-0 tracking-wider touch-none"
        {...(dragListeners || {})}
        onClick={(e) => e.stopPropagation()}
      >
        &#8942;&#8942;
      </span>
      {rank !== undefined && (
        <span className="font-mono text-[11px] text-text-tertiary min-w-[20px] text-right shrink-0">
          {rank}.
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isCompleted) {
            onUpdate(task._id, { status: 'active', completedAt: null } as any);
          } else {
            onComplete(task._id);
          }
        }}
        className={`w-4 h-4 border-[1.5px] rounded-[3px] shrink-0 transition-all relative ${
          isCompleted ? 'bg-green border-green' : 'border-text-tertiary hover:border-accent'
        }`}
      >
        {isCompleted && (
          <span className="absolute -top-[1px] left-[2px] text-[11px] text-white font-bold">&#10003;</span>
        )}
      </button>
      {showGroup && group && (
        <span className="font-mono text-[10px] tracking-wide px-[7px] py-[2px] rounded-[3px] bg-bg-active text-text-secondary shrink-0">
          {group.name}
        </span>
      )}
      <span className={`flex-1 text-[13px] leading-snug truncate ${isCompleted ? 'line-through text-text-tertiary' : 'text-text'}`}>
        {task.title}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {task.assignees.map((uid) => {
          const member = members?.find((m) => m.userId === uid);
          return (
            <span key={uid} className="font-mono text-[11px] text-blue">
              @{member?.username || uid.slice(0, 8)}
            </span>
          );
        })}
        {task.dueDate && !isCompleted && (
          <span className="font-mono text-[11px] text-text-tertiary">
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {isCompleted && (
          <span className="font-mono text-[10px] px-1.5 py-[1px] rounded-[3px] text-green bg-green-dim">
            done
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          className="font-mono text-[10px] text-text-tertiary opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:!text-red transition-all"
        >
          &#10005;
        </button>
      </div>
    </li>
  );
}
