'use client';

import { useState } from 'react';
import type { Task } from '@/types';

interface TaskDetailProps {
  task: Task;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskDetail({ task, onUpdate }: TaskDetailProps) {
  const [notes, setNotes] = useState(task.notes);
  const [notesEditing, setNotesEditing] = useState(false);

  const saveNotes = () => {
    if (notes !== task.notes) {
      onUpdate(task._id, { notes });
    }
    setNotesEditing(false);
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
      {task.subtasks.length > 0 && (
        <div className="mt-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">Subtasks</div>
          {task.subtasks.map((sub) => (
            <div key={sub._id} className="flex items-center gap-2 py-1 text-[13px] text-text-secondary">
              <div
                className={`w-3.5 h-3.5 border-[1.5px] rounded-[3px] shrink-0 relative ${
                  sub.completed ? 'bg-green border-green' : 'border-text-tertiary'
                }`}
              >
                {sub.completed && (
                  <span className="absolute -top-[2px] left-[1px] text-[10px] text-white font-bold">&#10003;</span>
                )}
              </div>
              <span className={sub.completed ? 'line-through text-text-tertiary' : ''}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
