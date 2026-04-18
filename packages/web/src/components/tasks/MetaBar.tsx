'use client';

import { useState, useRef, useEffect } from 'react';
import type { Task, TeamMember } from '@/types';

const SECTIONS = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'queued', label: 'Queued' },
  { key: 'someday', label: 'Someday' },
] as const;

const ENERGIES = [
  { key: 'quick', label: '⚡ Quick' },
  { key: 'deep', label: '🧩 Deep' },
  { key: 'people', label: '📞 People' },
  { key: 'hands-on', label: '🔧 Hands-on' },
] as const;

const PRIORITIES = [
  { key: 'urgent-important', icon: '🔴', label: 'Do Now' },
  { key: 'important', icon: '🔵', label: 'Schedule' },
  { key: 'urgent', icon: '🟠', label: 'Delegate' },
  { key: 'neither', icon: '⚪', label: 'Drop' },
] as const;

type PopoverType = 'section' | 'energy' | 'priority' | 'date' | 'assign' | null;

interface MetaBarProps {
  task: Task;
  members?: TeamMember[];
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 bg-bg-raised border border-border rounded-lg shadow-xl z-50 min-w-[140px] py-1">
      {children}
    </div>
  );
}

function PopoverItem({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 transition-all ${
        active ? 'text-text bg-bg-hover' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
      }`}
    >
      {children}
      {active && <span className="ml-auto text-accent text-[10px]">●</span>}
    </button>
  );
}

export function MetaBar({ task, members, onUpdate }: MetaBarProps) {
  const [open, setOpen] = useState<PopoverType>(null);

  const sectionLabel = SECTIONS.find((s) => s.key === task.pipelineSection)?.label || 'Active';
  const energyItem = ENERGIES.find((e) => e.key === task.energy);
  const priorityItem = PRIORITIES.find((p) => p.key === task.importance);
  const assignedMembers = members?.filter((m) => task.assignees.includes(m.userId)) || [];

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const toggle = (type: PopoverType) => setOpen(open === type ? null : type);

  return (
    <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
      {/* Row 1: section, energy, priority, date */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        {/* Section */}
        <div className="relative">
          <button onClick={() => toggle('section')} className="font-mono text-[11px] text-text-secondary hover:text-text px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all">
            {sectionLabel}
          </button>
          {open === 'section' && (
            <Popover onClose={() => setOpen(null)}>
              {SECTIONS.map((s) => (
                <PopoverItem key={s.key} active={task.pipelineSection === s.key} onClick={() => { onUpdate(task._id, { pipelineSection: s.key } as any); setOpen(null); }}>
                  {s.label}
                </PopoverItem>
              ))}
            </Popover>
          )}
        </div>

        <span className="text-text-tertiary text-[10px]">·</span>

        {/* Energy */}
        <div className="relative">
          <button onClick={() => toggle('energy')} className={`font-mono text-[11px] px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all ${energyItem ? 'text-text-secondary' : 'text-text-tertiary'}`}>
            {energyItem ? energyItem.label : '+energy'}
          </button>
          {open === 'energy' && (
            <Popover onClose={() => setOpen(null)}>
              {ENERGIES.map((e) => (
                <PopoverItem key={e.key} active={task.energy === e.key} onClick={() => { onUpdate(task._id, { energy: task.energy === e.key ? null : e.key } as any); setOpen(null); }}>
                  {e.label}
                </PopoverItem>
              ))}
              {task.energy && (
                <PopoverItem onClick={() => { onUpdate(task._id, { energy: null } as any); setOpen(null); }}>
                  <span className="text-text-tertiary">○ Clear</span>
                </PopoverItem>
              )}
            </Popover>
          )}
        </div>

        <span className="text-text-tertiary text-[10px]">·</span>

        {/* Priority */}
        <div className="relative">
          <button onClick={() => toggle('priority')} className={`font-mono text-[11px] px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all ${priorityItem ? 'text-text-secondary' : 'text-text-tertiary'}`}>
            {priorityItem ? `${priorityItem.icon}` : '+priority'}
          </button>
          {open === 'priority' && (
            <Popover onClose={() => setOpen(null)}>
              {PRIORITIES.map((p) => (
                <PopoverItem key={p.key} active={task.importance === p.key} onClick={() => { onUpdate(task._id, { importance: task.importance === p.key ? null : p.key } as any); setOpen(null); }}>
                  {p.icon} {p.label}
                </PopoverItem>
              ))}
              {task.importance && (
                <PopoverItem onClick={() => { onUpdate(task._id, { importance: null } as any); setOpen(null); }}>
                  <span className="text-text-tertiary">○ Clear</span>
                </PopoverItem>
              )}
            </Popover>
          )}
        </div>

        <span className="text-text-tertiary text-[10px]">·</span>

        {/* Due date */}
        <div className="relative">
          {open === 'date' ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate(task._id, { dueDate: val ? val + 'T12:00:00.000Z' : null } as any);
                  setOpen(null);
                }}
                onBlur={() => setOpen(null)}
                className="bg-bg-active border-none rounded px-2 py-[2px] font-mono text-[11px] text-text-secondary outline-none [color-scheme:dark]"
              />
              {task.dueDate && (
                <button onClick={() => { onUpdate(task._id, { dueDate: null } as any); setOpen(null); }} className="text-[10px] text-text-tertiary hover:text-red">✕</button>
              )}
            </div>
          ) : (
            <button onClick={() => toggle('date')} className={`font-mono text-[11px] px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all ${dueDateStr ? 'text-text-secondary' : 'text-text-tertiary'}`}>
              {dueDateStr || '+date'}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: assignees */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <div className="relative">
          {assignedMembers.length > 0 ? (
            <button onClick={() => toggle('assign')} className="flex items-center gap-1 font-mono text-[11px] text-blue px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all">
              {assignedMembers.map((m) => `@${m.username}`).join(' ')}
            </button>
          ) : (
            <button onClick={() => toggle('assign')} className="font-mono text-[11px] text-text-tertiary px-1.5 py-[2px] rounded hover:bg-bg-hover transition-all">
              +assign
            </button>
          )}
          {open === 'assign' && members && (
            <Popover onClose={() => setOpen(null)}>
              {members.map((m) => {
                const isAssigned = task.assignees.includes(m.userId);
                return (
                  <PopoverItem
                    key={m.userId}
                    active={isAssigned}
                    onClick={() => {
                      const newAssignees = isAssigned
                        ? task.assignees.filter((id) => id !== m.userId)
                        : [...task.assignees, m.userId];
                      onUpdate(task._id, { assignees: newAssignees } as any);
                    }}
                  >
                    @{m.username}
                  </PopoverItem>
                );
              })}
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
