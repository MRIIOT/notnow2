'use client';

import { use, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { SortableTaskRow } from '@/components/tasks/SortableTaskRow';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskInput } from '@/components/tasks/TaskInput';
import { generateKeyBetween } from '@/lib/ordering';
import type { Task } from '@/types';

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { tasks, createTask, updateTask, deleteTask, reorderTask } = useTasks('group', groupId);
  const { groups } = useGroups();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const group = groups.find((g) => g._id === groupId);
  const activeTasks = tasks.filter((t) => t.status === 'active');
  const doneTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled');
  const activeTask = activeId ? activeTasks.find((t) => t._id === activeId) : null;

  const handleComplete = (taskId: string) => updateTask.mutate({ taskId, status: 'completed' } as any);
  const handleCancel = (taskId: string) => updateTask.mutate({ taskId, status: 'cancelled' } as any);
  const handleDelete = (taskId: string) => deleteTask.mutate(taskId);
  const handleUpdate = (taskId: string, data: Partial<Task>) => updateTask.mutate({ taskId, ...data } as any);

  const handleAddTask = (title: string) => {
    createTask.mutate({ title, groupId });
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    const fromIndex = activeTasks.findIndex((t) => t._id === activeTaskId);
    const overIndex = activeTasks.findIndex((t) => t._id === overId);

    if (fromIndex === -1 || overIndex === -1) return;

    let newOrder: string;
    if (fromIndex < overIndex) {
      const afterOver = overIndex < activeTasks.length - 1 ? activeTasks[overIndex + 1].groupOrder : null;
      newOrder = generateKeyBetween(activeTasks[overIndex].groupOrder, afterOver);
    } else {
      const beforeOver = overIndex > 0 ? activeTasks[overIndex - 1].groupOrder : null;
      newOrder = generateKeyBetween(beforeOver, activeTasks[overIndex].groupOrder);
    }

    reorderTask.mutate({ taskId: activeTaskId, groupOrder: newOrder });
  }

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight">{group?.name || 'Group'}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        <TaskInput onSubmit={handleAddTask} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={activeTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            <div className="list-none">
              {activeTasks.map((t) => (
                <SortableTaskRow
                  key={t._id}
                  task={t}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && (
              <div className="bg-bg-raised border border-border rounded px-2 py-[7px] shadow-xl opacity-90">
                <div className="flex items-center gap-2.5">
                  <span className="text-text-tertiary text-[11px] tracking-wider">&#8942;&#8942;</span>
                  <div className="w-4 h-4 border-[1.5px] border-text-tertiary rounded-[3px] shrink-0" />
                  <span className="text-[13px] text-text">{activeTask.title}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {doneTasks.length > 0 && (
          <>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary pt-[18px] pb-2 flex items-center gap-2">
              Done <span className="font-normal opacity-60">{doneTasks.length} tasks</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <div className="list-none">
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
            </div>
          </>
        )}
      </div>
    </>
  );
}
