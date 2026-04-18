'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { SwipeToDelete } from './SwipeToDelete';
import { Conversation } from './Conversation';
import { MetaBar } from './MetaBar';
import type { Task, TeamMember, Subtask } from '@/types';

function SortableSubtaskRow({
  sub,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  sub: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SwipeToDelete onDelete={onDelete}>
        <div className="flex items-center gap-2 py-2 md:py-1 text-[15px] md:text-[13px] text-text-secondary group/sub">
          <span
            className="text-text-tertiary opacity-0 group-hover/sub:opacity-40 text-[10px] cursor-grab shrink-0 tracking-wider touch-none hidden md:inline"
            {...listeners}
          >
            &#8942;&#8942;
          </span>
          <button
            onClick={onToggle}
            className={`w-5 h-5 md:w-3.5 md:h-3.5 border-[1.5px] rounded-[3px] shrink-0 relative transition-all ${
              sub.completed ? 'bg-green border-green' : 'border-text-tertiary hover:border-accent'
            }`}
          >
            {sub.completed && (
              <span className="absolute -top-[2px] left-[1px] text-[10px] text-white font-bold">&#10003;</span>
            )}
          </button>
          <span className={`flex-1 ${sub.completed ? 'line-through text-text-tertiary' : ''}`}>{sub.title}</span>
          <div className="flex items-center gap-0.5 md:opacity-0 group-hover/sub:md:opacity-60 transition-all">
            <button onClick={onMoveUp} className="text-[10px] text-text-tertiary hover:text-text-secondary px-0.5 md:hidden">&#9650;</button>
            <button onClick={onMoveDown} className="text-[10px] text-text-tertiary hover:text-text-secondary px-0.5 md:hidden">&#9660;</button>
            <button onClick={onDelete} className="font-mono text-[10px] text-text-tertiary hover:!text-red transition-all hidden md:block ml-1">&#10005;</button>
          </div>
        </div>
      </SwipeToDelete>
    </div>
  );
}

interface TaskDetailProps {
  task: Task;
  members?: TeamMember[];
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskDetail({ task, members, onUpdate }: TaskDetailProps) {
  const [notes, setNotes] = useState(task.notes);
  const [notesEditing, setNotesEditing] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();

  const subtaskSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const saveNotes = () => {
    if (notes !== task.notes) {
      onUpdate(task._id, { notes });
    }
    setNotesEditing(false);
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim() || !teamId) return;
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title: newSubtask.trim() }),
    });
    setNewSubtask('');
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
  };

  const toggleSubtask = async (subId: string, completed: boolean) => {
    if (!teamId) return;
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/${subId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !completed }),
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
  };

  const deleteSubtask = async (subId: string) => {
    if (!teamId) return;
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/${subId}`, {
      method: 'DELETE',
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
  };

  const moveSubtask = async (subId: string, direction: 'up' | 'down') => {
    if (!teamId) return;
    const ids = task.subtasks.map((s) => s._id);
    const idx = ids.indexOf(subId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;
    // Swap
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds: ids }),
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
  };

  const handleSubtaskDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !teamId) return;

    const ids = task.subtasks.map((s) => s._id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = [...ids];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds: reordered }),
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
    qc.invalidateQueries({ queryKey: ['task', teamId, task._id] });
  };

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>

      {/* Compact meta bar */}
      <MetaBar task={task} members={members} onUpdate={onUpdate} />

      {/* Notes */}
      {notesEditing ? (
        <textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          className="w-full bg-bg border border-border-subtle rounded p-3 text-[13px] leading-relaxed text-text-secondary outline-none focus:border-accent min-h-[80px] resize-y font-body"
        />
      ) : (
        <div
          onClick={() => setNotesEditing(true)}
          className="bg-bg border border-border-subtle rounded p-3 text-[13px] leading-relaxed text-text-secondary min-h-[60px] whitespace-pre-wrap cursor-text hover:border-border transition-colors"
        >
          {task.notes || <span className="text-text-tertiary italic">Click to add notes...</span>}
        </div>
      )}

      {/* Subtasks */}
      <div className="mt-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">Subtasks</div>
        <DndContext sensors={subtaskSensors} collisionDetection={closestCenter} onDragEnd={handleSubtaskDragEnd}>
          <SortableContext items={task.subtasks.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            {task.subtasks.map((sub) => (
              <SortableSubtaskRow
                key={sub._id}
                sub={sub}
                onToggle={() => toggleSubtask(sub._id, sub.completed)}
                onDelete={() => deleteSubtask(sub._id)}
                onMoveUp={() => moveSubtask(sub._id, 'up')}
                onMoveDown={() => moveSubtask(sub._id, 'down')}
              />
            ))}
          </SortableContext>
        </DndContext>

        <form onSubmit={addSubtask} className="mt-1">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="+ Add subtask..."
            className="w-full bg-transparent border-none outline-none text-[12px] text-text-tertiary placeholder:text-text-tertiary py-1 font-body focus:text-text"
          />
        </form>
      </div>

      {/* Conversation */}
      <Conversation taskId={task._id} members={members} />
    </div>
  );
}
