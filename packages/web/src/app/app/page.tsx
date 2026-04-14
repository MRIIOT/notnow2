'use client';

import { useState } from 'react';
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
import { generateKeyBetween } from '@/lib/ordering';
import type { Task } from '@/types';

type Section = 'above' | 'below' | 'waiting' | 'someday';

export default function PipelinePage() {
  const { tasks, updateTask, deleteTask, reorderTask } = useTasks('pipeline');
  const { groups } = useGroups();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTasks = tasks.filter((t) => t.status === 'active');

  const sections: Record<Section, Task[]> = {
    above: activeTasks.filter((t) => t.pipelineSection === 'above'),
    below: activeTasks.filter((t) => t.pipelineSection === 'below'),
    waiting: activeTasks.filter((t) => t.pipelineSection === 'waiting'),
    someday: activeTasks.filter((t) => t.pipelineSection === 'someday'),
  };

  // All sortable IDs in one flat list for the DndContext
  const allIds = [...sections.above, ...sections.below, ...sections.waiting, ...sections.someday].map((t) => t._id);
  const activeTask = activeId ? activeTasks.find((t) => t._id === activeId) : null;

  function findSection(taskId: string): Section | null {
    for (const [section, tasks] of Object.entries(sections)) {
      if (tasks.find((t) => t._id === taskId)) return section as Section;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const fromSection = findSection(activeTaskId);
    const toSection = findSection(overId);
    if (!fromSection || !toSection) return;

    const targetList = [...sections[toSection]];
    const overIndex = targetList.findIndex((t) => t._id === overId);

    // Compute new pipelineOrder key
    const prev = overIndex > 0 ? targetList[overIndex - 1].pipelineOrder : null;
    const next = targetList[overIndex]?.pipelineOrder ?? null;

    // If dragging down within same section, adjust references
    let newOrder: string;
    const fromIndex = sections[fromSection].findIndex((t) => t._id === activeTaskId);

    if (fromSection === toSection && fromIndex < overIndex) {
      // Moving down: insert after the over item
      const afterOver = overIndex < targetList.length - 1 ? targetList[overIndex + 1].pipelineOrder : null;
      newOrder = generateKeyBetween(targetList[overIndex].pipelineOrder, afterOver);
    } else {
      // Moving up or cross-section: insert before the over item
      newOrder = generateKeyBetween(prev, next);
    }

    reorderTask.mutate({
      taskId: activeTaskId,
      pipelineOrder: newOrder,
      pipelineSection: toSection,
    });
  }

  const handleComplete = (taskId: string) => updateTask.mutate({ taskId, status: 'completed' } as any);
  const handleCancel = (taskId: string) => updateTask.mutate({ taskId, status: 'cancelled' } as any);
  const handleDelete = (taskId: string) => deleteTask.mutate(taskId);
  const handleUpdate = (taskId: string, data: Partial<Task>) => updateTask.mutate({ taskId, ...data } as any);

  let rank = 1;

  const renderSection = (sectionTasks: Task[], showRank: boolean) =>
    sectionTasks.map((t) => (
      <SortableTaskRow
        key={t._id}
        task={t}
        rank={showRank ? rank++ : undefined}
        showGroup
        groups={groups}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    ));

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9654;</span> Pipeline
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            <div className="list-none">
              {renderSection(sections.above, true)}
            </div>

            {(sections.below.length > 0 || sections.above.length > 0) && (
              <div className="flex items-center gap-2 py-1.5 opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, var(--color-accent) 0, var(--color-accent) 4px, transparent 4px, transparent 10px)' }} />
                <span className="font-mono text-[9px] uppercase tracking-[1.5px] text-accent shrink-0">below the line</span>
                <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, var(--color-accent) 0, var(--color-accent) 4px, transparent 4px, transparent 10px)' }} />
              </div>
            )}

            {sections.below.length > 0 && (
              <div className="list-none">
                {renderSection(sections.below, true)}
              </div>
            )}

            {sections.waiting.length > 0 && (
              <>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-blue pt-[18px] pb-2 flex items-center gap-2">
                  Waiting
                  <div className="flex-1 h-px bg-blue-dim" />
                </div>
                <div className="list-none">
                  {renderSection(sections.waiting, false)}
                </div>
              </>
            )}

            {sections.someday.length > 0 && (
              <>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary pt-[18px] pb-2 flex items-center gap-2">
                  Someday
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>
                <div className="list-none">
                  {renderSection(sections.someday, false)}
                </div>
              </>
            )}
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
      </div>
    </>
  );
}
