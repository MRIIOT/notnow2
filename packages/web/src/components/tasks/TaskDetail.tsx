'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Task, TeamMember } from '@/types';

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
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Due:</span>
          <input
            type="date"
            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate(task._id, { dueDate: val ? new Date(val).toISOString() : null } as any);
            }}
            className="bg-bg-active border-none rounded px-2 py-[3px] font-mono text-[11px] text-text-secondary outline-none [color-scheme:dark]"
          />
          {task.dueDate && (
            <button
              onClick={() => onUpdate(task._id, { dueDate: null } as any)}
              className="font-mono text-[10px] text-text-tertiary hover:text-red transition-colors"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Assignees */}
      {members && members.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Assign:</span>
          {members.map((m) => {
            const isAssigned = task.assignees.includes(m.userId);
            return (
              <button
                key={m.userId}
                onClick={() => {
                  const newAssignees = isAssigned
                    ? task.assignees.filter((id) => id !== m.userId)
                    : [...task.assignees, m.userId];
                  onUpdate(task._id, { assignees: newAssignees } as any);
                }}
                className={`font-mono text-[11px] px-2 py-[2px] rounded transition-all ${
                  isAssigned
                    ? 'text-blue bg-blue-dim border border-blue'
                    : 'text-text-tertiary bg-bg-active border border-transparent hover:text-text-secondary'
                }`}
              >
                @{m.userId.slice(-6)}
              </button>
            );
          })}
        </div>
      )}

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
