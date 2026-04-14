'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/hooks/useTeam';
import { useGroups } from '@/hooks/useGroups';
import { useTasks } from '@/hooks/useTasks';
import { useTimeSummary } from '@/hooks/useTimeEntries';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TimePage() {
  const { team } = useTeam();
  const { groups } = useGroups();
  const teamId = useAuthStore((s) => s.activeTeamId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  // Entry form state
  const [entryGroupId, setEntryGroupId] = useState('');
  const [entryHours, setEntryHours] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryNote, setEntryNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  const weekOf = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday.toISOString().split('T')[0];
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const d = new Date(weekOf);
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [weekOf]);

  const trackedMembers = team?.members.filter((m) => m.timeTrackingEnabled) || [];
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const activeUserId = selectedUserId || trackedMembers[0]?.userId || null;

  // Check if current user has time tracking enabled
  const currentUserTracked = team?.members.find((m) => m.userId === currentUserId)?.timeTrackingEnabled;

  const { data: summary, isLoading } = useTimeSummary(activeUserId, weekOf);

  const logTime = useMutation({
    mutationFn: (data: { groupId: string; hours: number; date: string; note: string }) =>
      api(`/teams/${teamId}/time`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-summary'] });
      setEntryHours('');
      setEntryNote('');
      setShowForm(false);
    },
  });

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryGroupId || !entryHours) return;
    logTime.mutate({
      groupId: entryGroupId,
      hours: parseFloat(entryHours),
      date: new Date(entryDate).toISOString(),
      note: entryNote,
    });
  };

  return (
    <>
      <div className="px-7 pt-5 pb-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-[18px] font-semibold tracking-tight flex items-center gap-2.5">
            <span className="text-text-tertiary text-[14px]">&#9201;</span> Time
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="font-mono text-[13px] px-2 py-[2px] border border-border rounded text-text-tertiary hover:bg-bg-hover hover:text-text-secondary transition-all"
            >
              &#9664;
            </button>
            <span className="font-mono text-[12px] text-text-secondary min-w-[130px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="font-mono text-[13px] px-2 py-[2px] border border-border rounded text-text-tertiary hover:bg-bg-hover hover:text-text-secondary transition-all"
            >
              &#9654;
            </button>
            <button
              onClick={() => {
                if (activeUserId && teamId) {
                  window.open(`/api/v1/teams/${teamId}/time/export?userId=${activeUserId}&weekOf=${weekOf}`, '_blank');
                }
              }}
              className="font-mono text-[11px] px-2.5 py-[4px] bg-bg-raised border border-border rounded text-text-secondary hover:bg-bg-hover hover:text-text transition-all ml-2"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-6 pb-10 max-w-[600px]">
        {/* Log time form */}
        {currentUserTracked && (
          <div className="mb-6">
            {showForm ? (
              <form onSubmit={handleLogTime} className="bg-bg-raised border border-border rounded-lg p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary mb-3">Log Time</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <select
                    value={entryGroupId}
                    onChange={(e) => setEntryGroupId(e.target.value)}
                    required
                    className="bg-bg border border-border rounded px-2 py-1.5 font-mono text-[12px] text-text outline-none focus:border-accent"
                  >
                    <option value="">Group</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={entryHours}
                    onChange={(e) => setEntryHours(e.target.value)}
                    placeholder="Hours"
                    required
                    className="bg-bg border border-border rounded px-2 py-1.5 font-mono text-[12px] text-accent w-20 outline-none focus:border-accent"
                  />
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-bg border border-border rounded px-2 py-1.5 font-mono text-[12px] text-text-secondary outline-none focus:border-accent [color-scheme:dark]"
                  />
                </div>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-[12px] text-text outline-none focus:border-accent mb-3 font-body"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={logTime.isPending}
                    className="font-mono text-[11px] bg-accent text-bg px-3 py-1.5 rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {logTime.isPending ? 'Logging...' : 'Log'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="font-mono text-[11px] text-text-tertiary px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="font-mono text-[12px] text-text-tertiary hover:text-accent transition-colors"
              >
                + Log time
              </button>
            )}
          </div>
        )}

        {/* Member selector */}
        {trackedMembers.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            {trackedMembers.map((m) => (
              <button
                key={m.userId}
                onClick={() => setSelectedUserId(m.userId)}
                className={`font-mono text-[11px] px-2.5 py-[3px] rounded transition-all ${
                  (activeUserId === m.userId)
                    ? 'text-blue bg-blue-dim border border-blue'
                    : 'text-text-tertiary bg-bg-active border border-transparent hover:text-text-secondary'
                }`}
              >
                @{m.username}
              </button>
            ))}
          </div>
        )}

        {trackedMembers.length === 0 ? (
          <p className="text-text-tertiary text-[13px] italic">
            No team members have time tracking enabled. Enable it in Settings.
          </p>
        ) : isLoading ? (
          <p className="text-text-tertiary font-mono text-sm">Loading...</p>
        ) : !summary || summary.groups.length === 0 ? (
          <p className="text-text-tertiary text-[13px] italic">No time entries this week.</p>
        ) : (
          <>
            {trackedMembers.length <= 1 && (
              <div className="font-mono text-[13px] text-blue mb-4">
                @{trackedMembers.find((m) => m.userId === activeUserId)?.username}
              </div>
            )}

            {summary.groups.map((g, i) => (
              <div key={i} className="mb-5">
                <div className="flex items-center justify-between py-2 border-b border-border-subtle mb-1">
                  <span className="font-mono text-[12px] text-text-secondary font-medium">{g.groupName}</span>
                  <span className="font-mono text-[11px] text-text-tertiary">${(g.rate / 100).toFixed(0)}/hr</span>
                </div>

                {g.entries.map((entry) => (
                  <div key={entry._id} className="flex items-center gap-3 px-2 py-[5px] text-[13px] text-text-secondary">
                    <span className="font-mono text-[11px] text-text-tertiary min-w-[50px]">
                      {formatDate(entry.date)}
                    </span>
                    <span className="font-mono text-[11px] text-accent min-w-[36px] text-right">
                      {entry.hours}h
                    </span>
                    <span className="flex-1 text-[12px] text-text-secondary">{entry.note}</span>
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 px-2 pt-1.5 border-t border-border-subtle mt-1">
                  <span className="font-mono text-[11px] text-accent">{g.hours}h</span>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-6 pt-4 border-t-2 border-border">
              {summary.groups.map((g, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1 font-mono text-[12px]">
                  <span className="text-text-secondary">{g.groupName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-accent min-w-[50px] text-right">{g.hours}h</span>
                    <span className="text-text-tertiary min-w-[60px] text-right">&times; ${(g.rate / 100).toFixed(0)}</span>
                    <span className="text-text min-w-[70px] text-right">${(g.hours * g.rate / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end gap-3 px-2 pt-2.5 mt-1.5 border-t border-border font-mono text-[14px] font-semibold text-accent">
                <span>{summary.totalHours}h</span>
                <span>${(summary.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
