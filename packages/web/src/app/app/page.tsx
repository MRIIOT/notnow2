'use client';

import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { TaskRow } from '@/components/tasks/TaskRow';
import type { Task } from '@/types';

export default function PipelinePage() {
  const { tasks, updateTask, deleteTask } = useTasks('pipeline');
  const { groups } = useGroups();

  const activeTasks = tasks.filter((t) => t.status === 'active');
  const above = activeTasks.filter((t) => t.pipelineSection === 'above');
  const below = activeTasks.filter((t) => t.pipelineSection === 'below');
  const waiting = activeTasks.filter((t) => t.pipelineSection === 'waiting');
  const someday = activeTasks.filter((t) => t.pipelineSection === 'someday');

  const handleComplete = (taskId: string) => {
    updateTask.mutate({ taskId, status: 'completed' } as { taskId: string } & Partial<Task>);
  };
  const handleCancel = (taskId: string) => {
    updateTask.mutate({ taskId, status: 'cancelled' } as { taskId: string } & Partial<Task>);
  };
  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };
  const handleUpdate = (taskId: string, data: Partial<Task>) => {
    updateTask.mutate({ taskId, ...data } as { taskId: string } & Partial<Task>);
  };

  let rank = 1;

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9654;</span> Pipeline
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        <ul className="list-none">
          {above.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              rank={rank++}
              showGroup
              groups={groups}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>

        {below.length > 0 && (
          <>
            <div className="flex items-center gap-2 py-1.5 opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, var(--color-accent) 0, var(--color-accent) 4px, transparent 4px, transparent 10px)' }} />
              <span className="font-mono text-[9px] uppercase tracking-[1.5px] text-accent shrink-0">below the line</span>
              <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, var(--color-accent) 0, var(--color-accent) 4px, transparent 4px, transparent 10px)' }} />
            </div>
            <ul className="list-none">
              {below.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  rank={rank++}
                  showGroup
                  groups={groups}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </ul>
          </>
        )}

        {waiting.length > 0 && (
          <>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-blue pt-[18px] pb-2 flex items-center gap-2">
              Waiting
              <div className="flex-1 h-px bg-blue-dim" />
            </div>
            <ul className="list-none">
              {waiting.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  showGroup
                  groups={groups}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </ul>
          </>
        )}

        {someday.length > 0 && (
          <>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary pt-[18px] pb-2 flex items-center gap-2">
              Someday
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <ul className="list-none">
              {someday.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  showGroup
                  groups={groups}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
