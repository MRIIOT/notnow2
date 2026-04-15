'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskRow } from './TaskRow';
import type { Task, Group, TeamMember } from '@/types';

interface SortableTaskRowProps {
  task: Task;
  rank?: number;
  showGroup?: boolean;
  groups?: Group[];
  members?: TeamMember[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function SortableTaskRow(props: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as string | number,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskRow {...props} dragListeners={listeners} />
    </div>
  );
}
