'use client';

import { use } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskInput } from '@/components/tasks/TaskInput';
import type { Task } from '@/types';

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { tasks, createTask, updateTask, deleteTask } = useTasks('group', groupId);
  const { groups } = useGroups();

  const group = groups.find((g) => g._id === groupId);
  const activeTasks = tasks.filter((t) => t.status === 'active');
  const doneTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled');

  const handleComplete = (taskId: string) => updateTask.mutate({ taskId, status: 'completed' } as any);
  const handleCancel = (taskId: string) => updateTask.mutate({ taskId, status: 'cancelled' } as any);
  const handleDelete = (taskId: string) => deleteTask.mutate(taskId);
  const handleUpdate = (taskId: string, data: Partial<Task>) => updateTask.mutate({ taskId, ...data } as any);

  const handleAddTask = (title: string) => {
    createTask.mutate({ title, groupId });
  };

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight">{group?.name || 'Group'}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        <TaskInput onSubmit={handleAddTask} />

        <ul className="list-none">
          {activeTasks.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>

        {doneTasks.length > 0 && (
          <>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary pt-[18px] pb-2 flex items-center gap-2">
              Done <span className="font-normal opacity-60">{doneTasks.length} tasks</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <ul className="list-none">
              {doneTasks.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
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
