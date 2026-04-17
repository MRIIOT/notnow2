'use client';

import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTaskRow } from '@/components/tasks/SortableTaskRow';
import { DroppableSection } from './DroppableSection';
import type { Task, Group, TeamMember } from '@/types';

const KANBAN_COLUMNS = [
  { key: 'in-progress', label: 'In Progress', sublabel: 'max 5', color: 'text-accent', line: 'bg-accent-dim' },
  { key: 'todo', label: 'To Do', sublabel: '', color: 'text-text-secondary', line: 'bg-border' },
  { key: 'done', label: 'Done', sublabel: '', color: 'text-green', line: 'bg-green-dim' },
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overSection, setOverSection] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const inProgress = tasks.filter((t) => t.status === 'active' && t.pipelineSection === 'active');
  const todo = tasks.filter((t) => t.status === 'active' && t.pipelineSection !== 'active');
  const done = tasks.filter((t) => t.status === 'completed').slice(0, 10);

  const columns: Record<string, Task[]> = { 'in-progress': inProgress, 'todo': todo, 'done': done };
  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;
  const wipOver = inProgress.length > 5;

  function findColumn(id: string): string | null {
    if (KANBAN_COLUMNS.find((c) => c.key === id)) return id;
    for (const [col, colTasks] of Object.entries(columns)) {
      if (colTasks.find((t) => t._id === id)) return col;
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverSection(null);
    const { active: dragActive, over } = event;
    if (!over) return;
    const taskId = dragActive.id as string;
    const overId = over.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const targetCol = KANBAN_COLUMNS.find((c) => c.key === overId) ? overId : findColumn(overId);
    if (!targetCol) return;

    if (targetCol === 'in-progress') {
      // Move to active section, mark active
      if (task.status !== 'active' || task.pipelineSection !== 'active') {
        onUpdate(taskId, { status: 'active', pipelineSection: 'active' } as any);
      }
    } else if (targetCol === 'todo') {
      // Move to queued section
      if (task.status !== 'active' || task.pipelineSection === 'active') {
        onUpdate(taskId, { status: 'active', pipelineSection: 'queued' } as any);
      }
    } else if (targetCol === 'done') {
      if (task.status !== 'completed') {
        onUpdate(taskId, { status: 'completed' } as any);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
      onDragOver={(e: DragOverEvent) => setOverSection(e.over ? findColumn(e.over.id as string) : null)}
      onDragEnd={handleDragEnd}
    >
      {KANBAN_COLUMNS.map(({ key, label, sublabel, color, line }) => {
        const colTasks = columns[key] || [];
        const extra = key === 'in-progress' && wipOver ? 'over WIP limit' : '';
        return (
          <DroppableSection
            key={key} id={key} label={label}
            sublabel={extra || (sublabel ? `${sublabel} · ${colTasks.length}` : `${colTasks.length}`)}
            color={key === 'in-progress' && wipOver ? 'text-red' : color}
            lineColor={line} isEmpty={colTasks.length === 0} overSection={overSection}
          >
            <SortableContext items={colTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
              {colTasks.map((t) => (
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
