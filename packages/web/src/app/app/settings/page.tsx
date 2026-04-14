'use client';

import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useGroups } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const { team, addMember, updateMember, removeMember, updateRates } = useTeam();
  const { groups } = useGroups();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [newUsername, setNewUsername] = useState('');
  const [addError, setAddError] = useState('');

  // Rate editing state
  const [editingRates, setEditingRates] = useState<string | null>(null);
  const [rateDefault, setRateDefault] = useState('');
  const [rateOverrides, setRateOverrides] = useState<{ groupId: string; rate: string }[]>([]);

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

  const startEditRates = (member: typeof team.members[0]) => {
    setEditingRates(member.userId);
    setRateDefault(String(member.defaultRate / 100 || ''));
    setRateOverrides(
      member.rateOverrides.map((o) => ({ groupId: o.groupId, rate: String(o.rate / 100) })),
    );
  };

  const saveRates = async (userId: string) => {
    const defaultCents = Math.round(parseFloat(rateDefault || '0') * 100);
    await updateMember.mutateAsync({ userId, defaultRate: defaultCents });
    await updateRates.mutateAsync({
      userId,
      overrides: rateOverrides
        .filter((o) => o.rate && o.groupId)
        .map((o) => ({ groupId: o.groupId, rate: Math.round(parseFloat(o.rate) * 100) })),
    });
    setEditingRates(null);
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
                <span className="font-mono text-[12px] text-text">@{m.userId === currentUserId ? 'you' : m.userId.slice(-6)}</span>
                {m.userId === currentUserId && (
                  <span className="font-mono text-[10px] text-accent opacity-70">you</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-text-tertiary">{m.role}</span>
                {m.userId !== currentUserId && m.role !== 'owner' && (
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
        </div>

        {/* Time Tracking */}
        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
            Time Tracking
          </div>
          {team.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-3 py-2 bg-bg-raised border border-border-subtle rounded mb-1.5">
              <span className="font-mono text-[12px] text-text">
                {m.userId === currentUserId ? '@you' : `@${m.userId.slice(-6)}`}
              </span>
              <button
                onClick={() => updateMember.mutate({ userId: m.userId, timeTrackingEnabled: !m.timeTrackingEnabled })}
                className={`font-mono text-[11px] px-2.5 py-[3px] rounded border transition-all ${
                  m.timeTrackingEnabled
                    ? 'text-green bg-green-dim border-green'
                    : 'text-text-tertiary bg-bg border-border'
                }`}
              >
                {m.timeTrackingEnabled ? 'on' : 'off'}
              </button>
            </div>
          ))}
        </div>

        {/* Rates */}
        {team.members
          .filter((m) => m.timeTrackingEnabled)
          .map((m) => (
            <div key={m.userId} className="mb-8">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
                Rates &mdash; @{m.userId === currentUserId ? 'you' : m.userId.slice(-6)}
              </div>

              {editingRates === m.userId ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-text-secondary w-24">Default</span>
                    <input
                      type="number"
                      value={rateDefault}
                      onChange={(e) => setRateDefault(e.target.value)}
                      placeholder="$/hr"
                      className="bg-bg border border-border rounded px-2 py-1 font-mono text-[12px] text-accent w-24 outline-none focus:border-accent"
                    />
                    <span className="font-mono text-[11px] text-text-tertiary">/hr</span>
                  </div>
                  {rateOverrides.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={o.groupId}
                        onChange={(e) => {
                          const next = [...rateOverrides];
                          next[i] = { ...next[i], groupId: e.target.value };
                          setRateOverrides(next);
                        }}
                        className="bg-bg border border-border rounded px-2 py-1 font-mono text-[12px] text-text-secondary w-24 outline-none"
                      >
                        <option value="">Group</option>
                        {groups.map((g) => (
                          <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={o.rate}
                        onChange={(e) => {
                          const next = [...rateOverrides];
                          next[i] = { ...next[i], rate: e.target.value };
                          setRateOverrides(next);
                        }}
                        placeholder="$/hr"
                        className="bg-bg border border-border rounded px-2 py-1 font-mono text-[12px] text-accent w-24 outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => setRateOverrides(rateOverrides.filter((_, j) => j !== i))}
                        className="text-text-tertiary hover:text-red font-mono text-[10px]"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setRateOverrides([...rateOverrides, { groupId: '', rate: '' }])}
                    className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary"
                  >
                    + Add override
                  </button>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveRates(m.userId)}
                      className="font-mono text-[11px] bg-accent text-bg px-3 py-1 rounded hover:bg-accent-hover transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRates(null)}
                      className="font-mono text-[11px] text-text-tertiary px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="font-mono text-[12px] text-text-secondary">Default</span>
                    <span className="font-mono text-[12px] text-accent">
                      ${(m.defaultRate / 100).toFixed(0)}/hr
                    </span>
                  </div>
                  {m.rateOverrides.map((o) => {
                    const group = groups.find((g) => g._id === o.groupId);
                    return (
                      <div key={o.groupId} className="flex items-center justify-between px-3 py-1.5">
                        <span className="font-mono text-[12px] text-text-secondary">{group?.name || '?'}</span>
                        <span className="font-mono text-[12px] text-accent">${(o.rate / 100).toFixed(0)}/hr</span>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => startEditRates(m)}
                    className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary mt-1 px-3"
                  >
                    Edit rates
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
