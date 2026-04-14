'use client';

import { useState, useRef, useEffect } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { Task, Group, TeamMember } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { ContextMenu } from './ContextMenu';

interface TaskRowProps {
  task: Task;
  rank?: number;
  showGroup?: boolean;
  groups?: Group[];
  members?: TeamMember[];
  dragListeners?: SyntheticListenerMap;
  onComplete: (taskId: string) => void;
  onCancel: (taskId: string, reason?: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskRow({ task, rank, showGroup, groups, members, dragListeners, onComplete, onCancel, onDelete, onUpdate }: TaskRowProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const selectTask = useUIStore((s) => s.selectTask);

  const group = groups?.find((g) => g._id === task.groupId);
  const isCompleted = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';
  const isDone = isCompleted || isCancelled;
  const isSelected = selectedTaskId === task._id;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenu && rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenu) setContextMenu(null);
        else if (isSelected) selectTask(null);
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, isSelected, selectTask]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const checkboxClass = isCancelled
    ? 'bg-red border-red'
    : isCompleted
      ? 'bg-green border-green'
      : 'border-text-tertiary hover:border-accent';

  return (
    <>
      <li
        ref={rowRef}
        className={`flex items-center gap-2.5 rounded cursor-pointer transition-colors group relative px-2 py-[7px] ${
          isSelected ? 'bg-accent-dim' : 'hover:bg-bg-hover'
        }`}
        onClick={() => selectTask(isSelected ? null : task._id)}
        onContextMenu={handleContextMenu}
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
            if (isDone) {
              onUpdate(task._id, { status: 'active', completedAt: null, cancelReason: '' } as any);
            } else {
              onComplete(task._id);
            }
          }}
          className={`w-4 h-4 border-[1.5px] rounded-[3px] shrink-0 transition-all relative ${checkboxClass}`}
        >
          {isCompleted && (
            <span className="absolute -top-[1px] left-[2px] text-[11px] text-white font-bold">&#10003;</span>
          )}
          {isCancelled && (
            <span className="absolute -top-[1px] left-[2px] text-[10px] text-white font-bold">&#10005;</span>
          )}
        </button>
        <span className={`flex-1 text-[13px] leading-snug truncate ${isDone ? 'line-through text-text-tertiary' : 'text-text'}`}>
          {task.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {task.reminders.some((r) => !r.sent) && (
            <span className="text-[11px] text-orange" title="Reminder set">&#128276;</span>
          )}
          {task.assignees.map((uid) => {
            const member = members?.find((m) => m.userId === uid);
            return (
              <span key={uid} className="font-mono text-[11px] text-blue">
                @{member?.username || uid.slice(0, 8)}
              </span>
            );
          })}
          {task.dueDate && !isDone && (
            <span className="font-mono text-[11px] text-text-tertiary">
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {showGroup && group && (
            <span className="font-mono text-[10px] tracking-wide px-[7px] py-[2px] rounded-[3px] bg-bg-active text-text-secondary">
              {group.name}
            </span>
          )}
          {isDone && (
            <span
              className={`font-mono text-[10px] px-1.5 py-[1px] rounded-[3px] ${
                isCompleted ? 'text-green bg-green-dim' : 'text-red bg-red-dim'
              }`}
            >
              {isCompleted ? 'completed' : 'cancelled'}
            </span>
          )}
          {isCancelled && task.cancelReason && (
            <span className="font-mono text-[10px] text-text-tertiary opacity-70">{task.cancelReason}</span>
          )}
        </div>
      </li>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onComplete={() => {
            onComplete(task._id);
            setContextMenu(null);
          }}
          onCancel={(reason) => {
            onCancel(task._id, reason);
            setContextMenu(null);
          }}
          onDelete={() => {
            onDelete(task._id);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
