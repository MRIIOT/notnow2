'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  const [showTimeLog, setShowTimeLog] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const teamId = useAuthStore((s) => s.activeTeamId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  // Check if current user has time tracking enabled
  const currentMember = members?.find((m) => m.userId === currentUserId);
  const timeTrackingEnabled = currentMember?.timeTrackingEnabled;

  // Fetch time entries for this task
  const { data: taskTimeData } = useQuery({
    queryKey: ['task-time', task._id],
    queryFn: () =>
      api<{ entries: Array<{ _id: string; hours: number; date: string; note: string }> }>(
        `/teams/${teamId}/time?taskId=${task._id}`
      ).then((d) => d.entries),
    enabled: !!teamId,
  });

  const totalHours = taskTimeData?.reduce((sum, e) => sum + e.hours, 0) || 0;

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

  const submitTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHours || !teamId) return;
    await api(`/teams/${teamId}/time`, {
      method: 'POST',
      body: JSON.stringify({
        taskId: task._id,
        groupId: task.groupId,
        hours: parseFloat(logHours),
        date: new Date(logDate).toISOString(),
        note: logNote,
      }),
    });
    setLogHours('');
    setLogNote('');
    setShowTimeLog(false);
    qc.invalidateQueries({ queryKey: ['task-time', task._id] });
    qc.invalidateQueries({ queryKey: ['time-summary'] });
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

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-orange">&#128276;</span>
          <input
            type="date"
            value={
              task.reminders.length > 0 && !task.reminders[0].sent
                ? new Date(task.reminders[0].date).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              const reminders = val
                ? [{ date: new Date(val).toISOString(), sent: false }]
                : [];
              onUpdate(task._id, { reminders } as any);
            }}
            className="bg-bg-active border-none rounded px-2 py-[3px] font-mono text-[11px] text-orange outline-none [color-scheme:dark]"
          />
          {task.reminders.length > 0 && !task.reminders[0].sent && (
            <button
              onClick={() => onUpdate(task._id, { reminders: [] } as any)}
              className="font-mono text-[10px] text-text-tertiary hover:text-red transition-colors"
            >
              &#10005;
            </button>
          )}
        </div>

        {/* Time logged chip */}
        {totalHours > 0 && (
          <span className="font-mono text-[11px] px-2 py-[3px] rounded bg-green-dim text-green">
            &#9201; {totalHours}h logged
          </span>
        )}
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

      {/* Quick time log */}
      {timeTrackingEnabled && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          {showTimeLog ? (
            <form onSubmit={submitTimeLog} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                placeholder="Hours"
                required
                className="bg-bg border border-border rounded px-2 py-1 font-mono text-[11px] text-accent w-16 outline-none focus:border-accent"
              />
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="bg-bg border border-border rounded px-2 py-1 font-mono text-[11px] text-text-secondary outline-none focus:border-accent [color-scheme:dark]"
              />
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Note"
                className="flex-1 bg-bg border border-border rounded px-2 py-1 text-[11px] text-text outline-none focus:border-accent font-body min-w-[100px]"
              />
              <button type="submit" className="font-mono text-[10px] bg-accent text-bg px-2.5 py-1 rounded hover:bg-accent-hover transition-colors">
                Log
              </button>
              <button type="button" onClick={() => setShowTimeLog(false)} className="font-mono text-[10px] text-text-tertiary px-1">
                &#10005;
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowTimeLog(true)}
              className="font-mono text-[11px] text-text-tertiary hover:text-green transition-colors"
            >
              &#9201; Log time
            </button>
          )}

          {/* Time entries for this task */}
          {taskTimeData && taskTimeData.length > 0 && (
            <div className="mt-2">
              {taskTimeData.map((e) => (
                <div key={e._id} className="flex items-center gap-2 py-0.5 text-[11px] text-text-tertiary">
                  <span className="font-mono min-w-[42px]">
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-mono text-accent min-w-[28px] text-right">{e.hours}h</span>
                  <span className="text-text-secondary">{e.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
