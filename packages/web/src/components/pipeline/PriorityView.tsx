'use client';

import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTaskRow } from '@/components/tasks/SortableTaskRow';
import { DroppableSection } from './DroppableSection';
import { generateKeyBetween } from '@/lib/ordering';
import type { Task, Group, TeamMember } from '@/types';

type ImportanceKey = 'urgent-important' | 'important' | 'urgent' | 'neither';

const PRIORITY_SECTIONS: { key: ImportanceKey | null; label: string; sublabel: string; color: string; line: string }[] = [
  { key: 'urgent-important', label: '██ Do Now', sublabel: 'Urgent + Important', color: 'text-red', line: 'bg-red-dim' },
  { key: 'important', label: '█░ Schedule', sublabel: 'Important, not urgent', color: 'text-blue', line: 'bg-blue-dim' },
  { key: 'urgent', label: '░█ Delegate', sublabel: 'Urgent, not important', color: 'text-orange', line: 'bg-orange-dim' },
  { key: 'neither', label: '░░ Drop', sublabel: 'Neither', color: 'text-text-tertiary', line: 'bg-border-subtle' },
  { key: null, label: '○ Untagged', sublabel: '', color: 'text-text-tertiary', line: 'bg-border-subtle' },
];

interface Props {
  tasks: Task[];
  groups: Group[];
  members?: TeamMember[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export function PriorityView({ tasks, groups, members, onComplete, onDelete, onUpdate }: Props) {
  const active = tasks.filter((t) => t.status === 'active');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overSection, setOverSection] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped: Record<string, Task[]> = {};
  for (const s of PRIORITY_SECTIONS) {
    const k = s.key ?? 'untagged';
    grouped[k] = active.filter((t) => s.key === null ? !t.importance : t.importance === s.key)
      .sort((a, b) => a.pipelineOrder.localeCompare(b.pipelineOrder));
  }

  const activeTask = activeId ? active.find((t) => t._id === activeId) : null;

  function findSection(id: string): string | null {
    for (const s of PRIORITY_SECTIONS) {
      const k = s.key ?? 'untagged';
      if (k === id) return k;
      if (grouped[k]?.find((t) => t._id === id)) return k;
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverSection(null);
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const taskId = dragActive.id as string;
    const overId = over.id as string;
    const task = active.find((t) => t._id === taskId);
    if (!task) return;

    const isDropOnSection = PRIORITY_SECTIONS.find((s) => (s.key ?? 'untagged') === overId);
    const toSectionKey = isDropOnSection ? (isDropOnSection.key ?? 'untagged') : findSection(overId);
    if (!toSectionKey) return;
    const toImportance = toSectionKey === 'untagged' ? null : toSectionKey;
    const fromSectionKey = task.importance ?? 'untagged';

    const updates: Record<string, unknown> = {};

    if (fromSectionKey !== toSectionKey) {
      updates.importance = toImportance;
    }

    if (!isDropOnSection) {
      const targetList = grouped[toSectionKey] || [];
      const overIndex = targetList.findIndex((t) => t._id === overId);
      const fromIndex = targetList.findIndex((t) => t._id === taskId);

      if (fromSectionKey === toSectionKey && fromIndex < overIndex) {
        const afterOver = overIndex < targetList.length - 1 ? targetList[overIndex + 1].pipelineOrder : null;
        updates.pipelineOrder = generateKeyBetween(targetList[overIndex].pipelineOrder, afterOver);
      } else {
        const prev = overIndex > 0 ? targetList[overIndex - 1].pipelineOrder : null;
        updates.pipelineOrder = generateKeyBetween(prev, targetList[overIndex]?.pipelineOrder ?? null);
      }
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(taskId, updates as any);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
      onDragOver={(e: DragOverEvent) => setOverSection(e.over ? findSection(e.over.id as string) : null)}
      onDragEnd={handleDragEnd}
    >
      {PRIORITY_SECTIONS.map(({ key, label, sublabel, color, line }) => {
        const k = key ?? 'untagged';
        const sectionTasks = grouped[k] || [];
        return (
          <DroppableSection
            key={k} id={k} label={label} sublabel={sublabel}
            color={color} lineColor={line} isEmpty={sectionTasks.length === 0} overSection={overSection}
          >
            <SortableContext items={sectionTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
              {sectionTasks.map((t) => (
                <SortableTaskRow key={t._id} task={t} showGroup groups={groups} members={members}
                  onComplete={onComplete} onDelete={onDelete} onUpdate={onUpdate} />
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
  );
}
