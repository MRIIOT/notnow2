'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/types';

interface TaskDetailProps {
  task: Task;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskDetail({ task, onUpdate }: TaskDetailProps) {
  const [notes, setNotes] = useState(task.notes);
  const [notesEditing, setNotesEditing] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();

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
  };

  const toggleSubtask = async (subId: string, completed: boolean) => {
    if (!teamId) return;
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/${subId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !completed }),
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
  };

  const deleteSubtask = async (subId: string) => {
    if (!teamId) return;
    await api(`/teams/${teamId}/tasks/${task._id}/subtasks/${subId}`, {
      method: 'DELETE',
    });
    qc.invalidateQueries({ queryKey: ['tasks', teamId] });
  };

  return (
    <div className="mt-3 pt-3 border-t border-border w-full" onClick={(e) => e.stopPropagation()}>
      {/* Meta chips */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {task.dueDate && (
          <span className="font-mono text-[11px] px-2 py-[3px] rounded bg-bg-active text-text-secondary">
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

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
        {task.subtasks.map((sub) => (
          <div key={sub._id} className="flex items-center gap-2 py-1 text-[13px] text-text-secondary group/sub">
            <button
              onClick={() => toggleSubtask(sub._id, sub.completed)}
              className={`w-3.5 h-3.5 border-[1.5px] rounded-[3px] shrink-0 relative transition-all ${
                sub.completed ? 'bg-green border-green' : 'border-text-tertiary hover:border-accent'
              }`}
            >
              {sub.completed && (
                <span className="absolute -top-[2px] left-[1px] text-[10px] text-white font-bold">&#10003;</span>
              )}
            </button>
            <span className={`flex-1 ${sub.completed ? 'line-through text-text-tertiary' : ''}`}>{sub.title}</span>
            <button
              onClick={() => deleteSubtask(sub._id)}
              className="font-mono text-[10px] text-text-tertiary opacity-0 group-hover/sub:opacity-50 hover:!opacity-100 hover:text-red transition-all"
            >
              &#10005;
            </button>
          </div>
        ))}

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
    </div>
  );
}
