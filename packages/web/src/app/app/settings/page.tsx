'use client';

import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { team, addMember, removeMember } = useTeam();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentMember = team?.members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'admin' || currentMember?.role === 'owner';
  const [newUsername, setNewUsername] = useState('');
  const [addError, setAddError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState(false);

  if (!team) return <div className="p-7 text-text-tertiary font-mono text-sm">Loading...</div>;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setAddError('');
    try {
      await addMember.mutateAsync({ username: newUsername.trim(), role: 'member' });
      setNewUsername('');
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="text-text-tertiary text-[14px]">&#9881;</span> Team Settings
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-6 pb-10 max-w-[600px]">
        {/* Members */}
        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
            Members
          </div>
          {team.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-3 py-2 bg-bg-raised border border-border-subtle rounded mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-text">@{m.username}{m.userId === currentUserId ? ' (you)' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-text-tertiary">{m.role}</span>
                {isAdmin && m.userId !== currentUserId && m.role !== 'owner' && (
                  <button
                    onClick={() => removeMember.mutate(m.userId)}
                    className="font-mono text-[10px] text-text-tertiary hover:text-red transition-colors"
                  >
                    remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAdmin && (
            <>
              <form onSubmit={handleAddMember} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="@username"
                  className="flex-1 bg-bg border border-border rounded px-2.5 py-[7px] font-mono text-[12px] text-text outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="font-mono text-[11px] bg-accent-dim text-accent border border-accent rounded px-3.5 py-[7px] hover:bg-accent hover:text-bg transition-all"
                >
                  Add
                </button>
              </form>
              {addError && <p className="text-red text-[11px] mt-1">{addError}</p>}
              <p className="text-[11px] text-text-tertiary mt-1 italic">User must have a notnow account.</p>
            </>
          )}
        </div>

        {/* Change Password */}
        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
            Change Password
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPwMsg('');
              setPwError(false);
              try {
                await api('/auth/change-password', {
                  method: 'POST',
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                setPwMsg('Password changed');
                setCurrentPassword('');
                setNewPassword('');
              } catch (err: unknown) {
                setPwError(true);
                setPwMsg(err instanceof Error ? err.message : 'Failed');
              }
            }}
            className="space-y-2"
          >
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
              className="w-full bg-bg border border-border rounded px-2.5 py-[7px] font-mono text-[12px] text-text outline-none focus:border-accent"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              required
              minLength={6}
              className="w-full bg-bg border border-border rounded px-2.5 py-[7px] font-mono text-[12px] text-text outline-none focus:border-accent"
            />
            {pwMsg && (
              <p className={`text-[11px] ${pwError ? 'text-red' : 'text-green'}`}>{pwMsg}</p>
            )}
            <button
              type="submit"
              className="font-mono text-[11px] bg-accent-dim text-accent border border-accent rounded px-3.5 py-[7px] hover:bg-accent hover:text-bg transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
