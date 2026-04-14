'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';

export function Topbar() {
  const { user, teams, activeTeamId, setActiveTeam } = useAuthStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeTeam = teams.find((t) => t._id === activeTeamId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="h-11 bg-bg border-b border-border flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-[15px] text-text tracking-tight">
          notnow<span className="text-text-tertiary">.</span>
        </span>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="font-mono text-[12px] text-text-secondary bg-bg-raised border border-border px-2.5 py-1 rounded flex items-center gap-1.5 hover:bg-bg-hover hover:text-text transition-all"
          >
            @{activeTeam?.handle || '...'} <span className="text-[9px] text-text-tertiary">&#9662;</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 bg-bg-raised border border-border rounded-lg p-1.5 min-w-[200px] z-50 shadow-xl">
              {teams.map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    setActiveTeam(t._id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded font-mono text-[12px] transition-all ${
                    t._id === activeTeamId
                      ? 'text-accent'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                  }`}
                >
                  @{t.handle}
                  {t._id === activeTeamId && <span className="text-[11px] text-accent">&#10003;</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <NotificationBell />
        <button
          onClick={logout}
          className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary px-2 py-1 rounded hover:bg-bg-hover transition-all"
        >
          logout
        </button>
        <span className="font-mono text-[12px] text-text-secondary bg-bg-raised border border-border px-2.5 py-1 rounded">
          @{user?.username}
        </span>
      </div>
    </div>
  );
}
