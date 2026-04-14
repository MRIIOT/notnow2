'use client';

import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { TaskRow } from '@/components/tasks/TaskRow';
import type { Task } from '@/types';

function getWeekBucket(dateStr: string | null): string {
  if (!dateStr) return 'No Date';
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  if (date < startOfWeek) return 'Overdue';
  if (date < endOfWeek) return 'This Week';
  if (date < endOfNextWeek) return 'Next Week';
  return date.toLocaleDateString('en-US', { month: 'long' });
}

export default function UpcomingPage() {
  const { tasks, updateTask, deleteTask } = useTasks('upcoming');
  const { groups } = useGroups();

  const activeTasks = tasks.filter((t) => t.status === 'active');

  // Group by time bucket
  const buckets: Record<string, Task[]> = {};
  for (const t of activeTasks) {
    const bucket = getWeekBucket(t.dueDate);
    if (!buckets[bucket]) buckets[bucket] = [];
    buckets[bucket].push(t);
  }

  const bucketOrder = ['Overdue', 'This Week', 'Next Week'];
  const sortedKeys = Object.keys(buckets).sort((a, b) => {
    const ai = bucketOrder.indexOf(a);
    const bi = bucketOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return 0;
  });

  const handleComplete = (taskId: string) => updateTask.mutate({ taskId, status: 'completed' } as any);
  const handleCancel = (taskId: string) => updateTask.mutate({ taskId, status: 'cancelled' } as any);
  const handleDelete = (taskId: string) => deleteTask.mutate(taskId);
  const handleUpdate = (taskId: string, data: Partial<Task>) => updateTask.mutate({ taskId, ...data } as any);

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9776;</span> Upcoming
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        {sortedKeys.map((bucket) => (
          <div key={bucket}>
            <div
              className={`font-mono text-[11px] font-semibold tracking-wide pt-4 pb-1.5 border-b border-border-subtle mb-0.5 ${
                bucket === 'Overdue'
                  ? 'text-red'
                  : bucket === 'This Week'
                    ? 'text-accent'
                    : 'text-text-secondary'
              }`}
            >
              {bucket}
            </div>
            <ul className="list-none">
              {buckets[bucket].map((t) => (
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
          </div>
        ))}
      </div>
    </>
  );
}
