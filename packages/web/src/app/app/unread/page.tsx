'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { useTeam } from '@/hooks/useTeam';
import { useMessageCounts } from '@/hooks/useMessageCounts';
import { TaskRow } from '@/components/tasks/TaskRow';
import { SwipeToDelete } from '@/components/tasks/SwipeToDelete';
import type { Task } from '@/types';

export default function UnreadPage() {
  const setActiveView = useUIStore((s) => s.setActiveView);
  useEffect(() => { setActiveView('pipeline'); }, [setActiveView]);

  const { tasks } = useTasks('pipeline');
  const { groups } = useGroups();
  const { team } = useTeam();
  const msgCounts = useMessageCounts();

  // Track all task IDs that have been unread while on this page
  // Grows as new unread tasks appear, never shrinks until remount
  const snapshotRef = useRef<Set<string>>(new Set());

  // Add any currently unread tasks to the snapshot
  for (const [taskId, isUnread] of Object.entries(msgCounts.unread)) {
    if (isUnread) snapshotRef.current.add(taskId);
  }

  const activeTasks = tasks.filter((t) => t.status === 'active');

  // Show all tasks that have been unread at any point during this visit
  const visibleTasks = activeTasks.filter((t) => snapshotRef.current.has(t._id));
  const stillUnread = visibleTasks.filter((t) => msgCounts.unread[t._id]).length;

  const handleComplete = (taskId: string) => {};
  const handleDelete = (taskId: string) => {};
  const handleUpdate = (taskId: string, data: Partial<Task>) => {};

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#128172;</span> Unread
          {visibleTasks.length > 0 && (
            <span className="font-mono text-[12px] font-normal text-text-tertiary">
              {stillUnread} of {visibleTasks.length} unread
            </span>
          )}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <span className="text-[32px] mb-3 opacity-30">&#128172;</span>
            <p className="text-[13px]">No unread messages</p>
          </div>
        ) : (
          <div className="list-none">
            {visibleTasks.map((t) => {
              const isNowRead = !msgCounts.unread[t._id];
              return (
                <div key={t._id} className={`transition-opacity duration-500 ${isNowRead ? 'opacity-40' : ''}`}>
                  <SwipeToDelete onDelete={() => handleDelete(t._id)}>
                    <TaskRow
                      task={t}
                      showGroup
                      groups={groups}
                      members={team?.members}
                      messageCount={msgCounts.counts[t._id]}
                      hasUnread={!isNowRead}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  </SwipeToDelete>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
