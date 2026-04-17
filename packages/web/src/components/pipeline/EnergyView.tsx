'use client';

import { TaskRow } from '@/components/tasks/TaskRow';
import { SwipeToDelete } from '@/components/tasks/SwipeToDelete';
import type { Task, Group, TeamMember } from '@/types';

const ENERGY_SECTIONS = [
  { key: 'quick' as const, label: '⚡ Quick Wins', color: 'text-accent', line: 'bg-accent-dim' },
  { key: 'deep' as const, label: '🧩 Deep Work', color: 'text-blue', line: 'bg-blue-dim' },
  { key: 'people' as const, label: '📞 Needs People', color: 'text-green', line: 'bg-green-dim' },
  { key: 'hands-on' as const, label: '🔧 Hands-on', color: 'text-orange', line: 'bg-orange-dim' },
  { key: null, label: '○ Untagged', color: 'text-text-tertiary', line: 'bg-border-subtle' },
];

interface Props {
  tasks: Task[];
  groups: Group[];
  members?: TeamMember[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export function EnergyView({ tasks, groups, members, onComplete, onDelete, onUpdate }: Props) {
  const active = tasks.filter((t) => t.status === 'active');

  return (
    <>
      {ENERGY_SECTIONS.map(({ key, label, color, line }) => {
        const sectionTasks = active.filter((t) => key === null ? !t.energy : t.energy === key);
        if (sectionTasks.length === 0 && key !== null) return null;

        return (
          <div key={key ?? 'untagged'} className="mb-2">
            <div className={`font-mono text-[10px] font-semibold uppercase tracking-[1.5px] ${color} pt-3 pb-1.5 flex items-center gap-2`}>
              {label}
              <span className="font-normal opacity-60">{sectionTasks.length}</span>
              <div className={`flex-1 h-px ${line}`} />
            </div>
            {sectionTasks.length === 0 ? (
              <div className="text-[11px] font-mono text-text-tertiary opacity-40 py-3 text-center">
                Tag tasks from the detail pane
              </div>
            ) : (
              sectionTasks.map((t) => (
                <SwipeToDelete key={t._id} onDelete={() => onDelete(t._id)}>
                  <TaskRow
                    task={t}
                    showGroup
                    groups={groups}
                    members={members}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                  />
                </SwipeToDelete>
              ))
            )}
          </div>
        );
      })}
    </>
  );
}
