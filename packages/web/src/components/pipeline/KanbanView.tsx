'use client';

import { TaskRow } from '@/components/tasks/TaskRow';
import { SwipeToDelete } from '@/components/tasks/SwipeToDelete';
import type { Task, Group, TeamMember } from '@/types';

const KANBAN_SECTIONS = [
  { key: 'in-progress' as const, label: 'In Progress', sublabel: 'max 5', color: 'text-accent', line: 'bg-accent-dim' },
  { key: 'todo' as const, label: 'To Do', sublabel: '', color: 'text-text-secondary', line: 'bg-border' },
  { key: 'done' as const, label: 'Done', sublabel: '', color: 'text-green', line: 'bg-green-dim' },
];

interface Props {
  tasks: Task[];
  groups: Group[];
  members?: TeamMember[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export function KanbanView({ tasks, groups, members, onComplete, onDelete, onUpdate }: Props) {
  // Map task status/section to kanban columns
  const inProgress = tasks.filter((t) => t.status === 'active' && t.pipelineSection === 'active');
  const todo = tasks.filter((t) => t.status === 'active' && t.pipelineSection !== 'active');
  const done = tasks.filter((t) => t.status === 'completed');

  const columns = [
    { ...KANBAN_SECTIONS[0], tasks: inProgress },
    { ...KANBAN_SECTIONS[1], tasks: todo },
    { ...KANBAN_SECTIONS[2], tasks: done.slice(0, 10) },
  ];

  const wipOver = inProgress.length > 5;

  return (
    <>
      {columns.map(({ key, label, sublabel, color, line, tasks: colTasks }) => (
        <div key={key} className="mb-2">
          <div className={`font-mono text-[10px] font-semibold uppercase tracking-[1.5px] ${color} pt-3 pb-1.5 flex items-center gap-2`}>
            {label}
            <span className="font-normal opacity-60">{colTasks.length}</span>
            {key === 'in-progress' && wipOver && (
              <span className="text-red font-normal normal-case tracking-normal">over WIP limit</span>
            )}
            {sublabel && !wipOver && (
              <span className="font-normal opacity-40 normal-case tracking-normal">{sublabel}</span>
            )}
            <div className={`flex-1 h-px ${line}`} />
          </div>
          {colTasks.length === 0 ? (
            <div className="text-[11px] font-mono text-text-tertiary opacity-40 py-3 text-center">
              {key === 'done' ? 'Complete tasks to see them here' : 'Empty'}
            </div>
          ) : (
            colTasks.map((t) => (
              <SwipeToDelete key={t._id} onDelete={() => onDelete(t._id)}>
                <TaskRow
                  task={t}
                  showGroup
                  groups={groups}
                  members={members}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              </SwipeToDelete>
            ))
          )}
        </div>
      ))}
    </>
  );
}
