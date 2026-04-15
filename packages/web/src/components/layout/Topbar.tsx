'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';

export function Topbar() {
  const { user, teams, activeTeamId, setActiveTeam } = useAuthStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { logout, createTeam, checkHandle } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  const activeTeam = teams.find((t) => t._id === activeTeamId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const onHandleChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNewHandle(clean);
    if (clean.length >= 3) {
      const avail = await checkHandle(clean);
      setHandleAvailable(avail);
    } else {
      setHandleAvailable(null);
    }
  };

  const onCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await createTeam(newHandle, newDisplayName || newHandle);
      setNewHandle('');
      setNewDisplayName('');
      setHandleAvailable(null);
      setCreating(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="h-11 bg-bg border-b border-border flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden font-mono text-[16px] text-text-secondary hover:text-text px-1"
        >
          &#9776;
        </button>
        <Image src="/logo.png" alt="notnow" width={28} height={28} className="rounded hidden md:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setCreating(false); }}
            className="font-mono text-[12px] text-text-secondary bg-bg-raised border border-border px-2.5 py-1 rounded flex items-center gap-1.5 hover:bg-bg-hover hover:text-text transition-all"
          >
            @{activeTeam?.handle || '...'} <span className="text-[9px] text-text-tertiary">&#9662;</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 bg-bg-raised border border-border rounded-lg p-1.5 min-w-[240px] z-50 shadow-xl">
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
              <div className="h-px bg-border mx-1 my-1" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setCreating(true);
                }}
                className="w-full px-2.5 py-1.5 rounded font-mono text-[11px] text-text-tertiary hover:bg-bg-hover hover:text-text-secondary transition-all text-left"
              >
                + Create team
              </button>
            </div>
          )}

          {creating && (
            <div ref={createRef} className="absolute top-[calc(100%+4px)] left-0 bg-bg-raised border border-border rounded-lg p-3 min-w-[260px] z-50 shadow-xl">
              <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary mb-2">Create Team</div>
              <form onSubmit={onCreateTeam}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="font-mono text-[11px] text-text-tertiary">@</span>
                  <input
                    autoFocus
                    type="text"
                    value={newHandle}
                    onChange={(e) => onHandleChange(e.target.value)}
                    placeholder="handle"
                    className="flex-1 bg-bg border border-border rounded px-2 py-1.5 font-mono text-[11px] text-text outline-none focus:border-accent"
                  />
                  {handleAvailable !== null && (
                    <span className={`font-mono text-[9px] ${handleAvailable ? 'text-green' : 'text-red'}`}>
                      {handleAvailable ? '✓' : '✕'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-[11px] text-text outline-none focus:border-accent mb-2 font-body"
                />
                {createError && <p className="text-red text-[10px] mb-2">{createError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={handleAvailable === false || newHandle.length < 3 || createLoading}
                    className="font-mono text-[10px] bg-accent text-bg px-3 py-1.5 rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="font-mono text-[10px] text-text-tertiary px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={logout}
          className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary px-2 py-1 rounded hover:bg-bg-hover transition-all hidden md:block"
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
