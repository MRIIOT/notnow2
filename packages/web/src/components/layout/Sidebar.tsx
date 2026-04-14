'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGroups } from '@/hooks/useGroups';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { groups, createGroup } = useGroups();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const nav = (path: string) => router.push(path);

  const isActive = (path: string) => pathname === path;

  const onAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createGroup.mutateAsync(newName.trim());
    setNewName('');
    setAdding(false);
  };

  return (
    <div className="w-[220px] bg-bg-surface border-r border-border flex flex-col shrink-0 overflow-y-auto">
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
      </div>

      <div className="mx-[18px] h-px bg-border my-1.5" />

      <div className="p-3 pt-1.5 flex-1">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-text-tertiary px-2 mb-1.5">
          Groups
        </div>
        {groups.map((g) => (
          <button
            key={g._id}
            onClick={() => nav(`/app/groups/${g._id}`)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] transition-all ${
              pathname === `/app/groups/${g._id}`
                ? 'bg-accent-dim text-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text'
            }`}
          >
            <span className="truncate">{g.name}</span>
          </button>
        ))}

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
    </div>
  );
}
