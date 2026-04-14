'use client';

import { useState, useRef, useEffect } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { Task, Group } from '@/types';
import { TaskDetail } from './TaskDetail';
import { ContextMenu } from './ContextMenu';

interface TaskRowProps {
  task: Task;
  rank?: number;
  showGroup?: boolean;
  groups?: Group[];
  dragListeners?: SyntheticListenerMap;
  onComplete: (taskId: string) => void;
  onCancel: (taskId: string, reason?: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskRow({ task, rank, showGroup, groups, dragListeners, onComplete, onCancel, onDelete, onUpdate }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);

  const group = groups?.find((g) => g._id === task.groupId);
  const isCompleted = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';
  const isDone = isCompleted || isCancelled;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenu && rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

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
        className={`flex items-start gap-2.5 rounded cursor-pointer transition-colors group relative ${
          expanded
            ? 'bg-bg-raised border border-border rounded-lg p-3 my-1 flex-col'
            : 'px-2 py-[7px] hover:bg-bg-hover'
        }`}
        onClick={() => !isDone && setExpanded(!expanded)}
        onContextMenu={handleContextMenu}
      >
        <div className={`flex items-center gap-2.5 w-full ${expanded ? '' : ''}`}>
          <span
            className="text-text-tertiary opacity-0 group-hover:opacity-50 text-[11px] cursor-grab shrink-0 tracking-wider mt-0.5 touch-none"
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
              if (!isDone) onComplete(task._id);
            }}
            className={`w-4 h-4 border-[1.5px] rounded-[3px] shrink-0 transition-all relative mt-0.5 ${checkboxClass}`}
          >
            {isCompleted && (
              <span className="absolute -top-[1px] left-[2px] text-[11px] text-white font-bold">&#10003;</span>
            )}
            {isCancelled && (
              <span className="absolute -top-[1px] left-[2px] text-[10px] text-white font-bold">&#10005;</span>
            )}
          </button>
          <span className={`flex-1 text-[13px] leading-snug ${isDone ? 'line-through text-text-tertiary' : 'text-text'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-2.5 shrink-0">
            {task.assignees.length > 0 && (
              <span className="font-mono text-[11px] text-blue">@assigned</span>
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
        </div>

        {expanded && (
          <TaskDetail task={task} onUpdate={onUpdate} />
        )}
      </li>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onComplete={() => {
            onComplete(task._id);
            setContextMenu(null);
          }}
          onCancel={() => {
            onCancel(task._id);
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
