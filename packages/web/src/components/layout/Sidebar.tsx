'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGroups } from '@/hooks/useGroups';
import { useTaskCounts } from '@/hooks/useTaskCounts';
import { useTeam } from '@/hooks/useTeam';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import type { Group } from '@/types';

function SortableGroupItem({ group, isActive, count, onDelete }: { group: Group; isActive: boolean; count?: number; onDelete?: () => void }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        onClick={() => router.push(`/app/groups/${group._id}`)}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] transition-all group/item ${
          isActive ? 'bg-accent-dim text-accent' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
        }`}
      >
        <span className="truncate">{group.name}</span>
        <div className="flex items-center gap-1.5">
          {count !== undefined && count > 0 && (
            <span className={`font-mono text-[11px] ${isActive ? 'text-accent opacity-60' : 'text-text-tertiary'}`}>
              {count}
            </span>
          )}
          {(!count || count === 0) && onDelete && (
            <span
              className="font-mono text-[10px] text-text-tertiary opacity-0 group-hover/item:opacity-50 hover:!opacity-100 hover:!text-red transition-all cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              &#10005;
            </span>
          )}
          <span
            className="text-text-tertiary opacity-0 group-hover/item:opacity-50 text-[11px] cursor-grab tracking-wider touch-none"
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            &#8942;&#8942;
          </span>
        </div>
      </button>
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const { groups, createGroup, reorderGroups, deleteGroup } = useGroups();
  const taskCounts = useTaskCounts();
  const { team } = useTeam();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentRole = team?.members.find((m) => m.userId === currentUserId)?.role;
  const isAdmin = currentRole === 'admin' || currentRole === 'owner';
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nav = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };
  const isActive = (path: string) => pathname === path;

  const onAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createGroup.mutateAsync(newName.trim());
    setNewName('');
    setAdding(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => g._id === active.id);
    const newIndex = groups.findIndex((g) => g._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build new ordered IDs
    const newGroups = [...groups];
    const [moved] = newGroups.splice(oldIndex, 1);
    newGroups.splice(newIndex, 0, moved);

    reorderGroups.mutate(newGroups.map((g) => g._id));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`
        w-[220px] bg-bg-surface border-r border-border flex flex-col shrink-0 overflow-y-auto
        fixed md:relative inset-y-0 left-0 z-40
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Close button on mobile */}
      <div className="flex items-center justify-between p-3 pb-0 md:hidden">
        <span className="font-mono font-bold text-[14px] text-text">notnow<span className="text-text-tertiary">.</span></span>
        <button onClick={() => setSidebarOpen(false)} className="font-mono text-[14px] text-text-tertiary hover:text-text">&#10005;</button>
      </div>
      <div className="p-3 pb-1.5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-text-tertiary px-2 mb-1.5">
          Views
        </div>
        <button
          onClick={() => nav('/app')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
            isActive('/app') ? 'bg-accent-dim text-accent' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
          }`}
        >
          <span className="font-mono text-[13px] w-4 text-center">&#9654;</span>
          Pipeline
        </button>
        <button
          onClick={() => nav('/app/upcoming')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
            isActive('/app/upcoming')
              ? 'bg-accent-dim text-accent'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text'
          }`}
        >
          <span className="font-mono text-[13px] w-4 text-center">&#9776;</span>
          Upcoming
        </button>
        <button
          onClick={() => nav('/app/settings')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
            isActive('/app/settings')
              ? 'bg-accent-dim text-accent'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text'
          }`}
        >
          <span className="font-mono text-[13px] w-4 text-center">&#9881;</span>
          Settings
        </button>
      </div>

      <div className="mx-[18px] h-px bg-border my-1.5" />

      <div className="p-3 pt-1.5 flex-1">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-text-tertiary px-2 mb-1.5">
          Groups
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={groups.map((g) => g._id)} strategy={verticalListSortingStrategy}>
            {groups.map((g) => (
              <SortableGroupItem
                key={g._id}
                group={g}
                isActive={pathname === `/app/groups/${g._id}`}
                count={taskCounts[g._id]}
                onDelete={isAdmin ? () => deleteGroup.mutate(g._id) : undefined}
              />
            ))}
          </SortableContext>
        </DndContext>

        {adding ? (
          <form onSubmit={onAddGroup} className="mt-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => {
                if (!newName.trim()) setAdding(false);
              }}
              placeholder="Group name"
              className="w-full bg-bg border border-border rounded px-2 py-1 text-[12px] text-text font-mono outline-none focus:border-accent"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[12px] text-text-tertiary font-mono hover:bg-bg-hover hover:text-text-secondary transition-all mt-1"
          >
            + New group
          </button>
        )}
      </div>

      <div className="mx-[18px] h-px bg-border my-1.5" />

      <div className="p-3 pt-1.5 pb-3">
        <button
          onClick={() => nav('/app/trash')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
            isActive('/app/trash')
              ? 'bg-accent-dim text-accent'
              : 'text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
          }`}
        >
          <span className="font-mono text-[13px] w-4 text-center">&#9249;</span>
          Trash
        </button>
      </div>
    </div>
    </>
  );
}
