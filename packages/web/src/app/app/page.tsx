'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { useGroups } from '@/hooks/useGroups';
import { useTeam } from '@/hooks/useTeam';
import { SortableTaskRow } from '@/components/tasks/SortableTaskRow';
import { TaskSkeleton, EmptyState } from '@/components/tasks/TaskSkeleton';
import { generateKeyBetween } from '@/lib/ordering';
import type { Task } from '@/types';

type Section = 'above' | 'below' | 'waiting' | 'someday';

const SECTION_ORDER: Section[] = ['waiting', 'above', 'below', 'someday'];

const SECTION_CONFIG: Record<Section, { label: string; color: string; lineColor: string }> = {
  waiting: { label: 'Waiting', color: 'text-blue', lineColor: 'bg-blue-dim' },
  above: { label: 'Active', color: 'text-accent', lineColor: 'bg-accent-dim' },
  below: { label: 'Below the line', color: 'text-text-secondary', lineColor: 'bg-border' },
  someday: { label: 'Someday', color: 'text-text-tertiary', lineColor: 'bg-border-subtle' },
};

function DroppableSection({
  id,
  children,
  label,
  color,
  lineColor,
  isEmpty,
  overSection,
}: {
  id: Section;
  children: React.ReactNode;
  label: string;
  color: string;
  lineColor: string;
  isEmpty: boolean;
  overSection: Section | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isHighlighted = isOver || overSection === id;

  return (
    <div className="mb-2">
      <div className={`font-mono text-[10px] font-semibold uppercase tracking-[1.5px] ${color} pt-3 pb-1.5 flex items-center gap-2`}>
        {label}
        <div className={`flex-1 h-px ${lineColor}`} />
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[36px] rounded transition-colors ${
          isHighlighted ? 'bg-bg-hover ring-1 ring-accent/30' : ''
        }`}
      >
        {children}
        {isEmpty && (
          <div className={`flex items-center justify-center py-3 text-[11px] font-mono transition-colors ${
            isHighlighted ? 'text-text-secondary' : 'text-text-tertiary opacity-40'
          }`}>
            {isHighlighted ? 'Drop here' : 'Empty'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { tasks, isLoading, updateTask, deleteTask, reorderTask } = useTasks('pipeline');
  const { groups } = useGroups();
  const { team } = useTeam();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overSection, setOverSection] = useState<Section | null>(null);

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

  const activeTask = activeId ? activeTasks.find((t) => t._id === activeId) : null;

  function findSection(id: string): Section | null {
    // Check if it's a section droppable ID
    if (SECTION_ORDER.includes(id as Section)) return id as Section;
    // Otherwise find which section the task belongs to
    for (const [section, sectionTasks] of Object.entries(sections)) {
      if (sectionTasks.find((t) => t._id === id)) return section as Section;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverSection(null);
      return;
    }
    const section = findSection(over.id as string);
    setOverSection(section);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverSection(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const fromSection = findSection(activeTaskId);

    // Determine target section: either a section droppable or the section of the task being dropped on
    let toSection: Section | null;
    if (SECTION_ORDER.includes(overId as Section)) {
      // Dropped on an empty section zone
      toSection = overId as Section;
    } else {
      toSection = findSection(overId);
    }

    if (!fromSection || !toSection) return;

    // Dropping on an empty section — append at the end
    if (SECTION_ORDER.includes(overId as Section)) {
      const targetList = sections[toSection];
      const lastOrder = targetList.length > 0 ? targetList[targetList.length - 1].pipelineOrder : null;
      const newOrder = generateKeyBetween(lastOrder, null);

      reorderTask.mutate({
        taskId: activeTaskId,
        pipelineOrder: newOrder,
        pipelineSection: toSection,
      });
      return;
    }

    // Dropping on another task
    if (activeTaskId === overId) return;

    const targetList = [...sections[toSection]];
    const overIndex = targetList.findIndex((t) => t._id === overId);
    const fromIndex = sections[fromSection].findIndex((t) => t._id === activeTaskId);

    let newOrder: string;
    if (fromSection === toSection && fromIndex < overIndex) {
      const afterOver = overIndex < targetList.length - 1 ? targetList[overIndex + 1].pipelineOrder : null;
      newOrder = generateKeyBetween(targetList[overIndex].pipelineOrder, afterOver);
    } else {
      const prev = overIndex > 0 ? targetList[overIndex - 1].pipelineOrder : null;
      const next = targetList[overIndex]?.pipelineOrder ?? null;
      newOrder = generateKeyBetween(prev, next);
    }

    reorderTask.mutate({
      taskId: activeTaskId,
      pipelineOrder: newOrder,
      pipelineSection: toSection,
    });
  }

  const handleComplete = (taskId: string) => updateTask.mutate({ taskId, status: 'completed' } as any);
  const handleDelete = (taskId: string) => deleteTask.mutate(taskId);
  const handleUpdate = (taskId: string, data: Partial<Task>) => updateTask.mutate({ taskId, ...data } as any);

  let rank = 1;

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9654;</span> Pipeline
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2 pb-10">
        {isLoading ? (
          <TaskSkeleton count={8} />
        ) : activeTasks.length === 0 ? (
          <EmptyState icon="&#9654;" message="No tasks in the pipeline. Add tasks from a group view." />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {SECTION_ORDER.map((sectionKey) => {
              const config = SECTION_CONFIG[sectionKey];
              const sectionTasks = sections[sectionKey];
              const showRank = sectionKey === 'above' || sectionKey === 'below';

              return (
                <DroppableSection
                  key={sectionKey}
                  id={sectionKey}
                  label={config.label}
                  color={config.color}
                  lineColor={config.lineColor}
                  isEmpty={sectionTasks.length === 0}
                  overSection={overSection}
                >
                  <SortableContext items={sectionTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                    {sectionTasks.map((t) => (
                      <SortableTaskRow
                        key={t._id}
                        task={t}
                        rank={showRank ? rank++ : undefined}
                        showGroup
                        groups={groups}
                        members={team?.members}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </SortableContext>
                </DroppableSection>
              );
            })}

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
        )}
      </div>
    </>
  );
}
