'use client';

import { useState, useMemo } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useTimeSummary } from '@/hooks/useTimeEntries';
import { useAuthStore } from '@/stores/authStore';

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
  const teamId = useAuthStore((s) => s.activeTeamId);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekOf = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday.toISOString().split('T')[0];
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const d = new Date(weekOf);
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [weekOf]);

  // Find members with time tracking enabled
  const trackedMembers = team?.members.filter((m) => m.timeTrackingEnabled) || [];
  const selectedUserId = trackedMembers[0]?.userId || null;

  const { data: summary, isLoading } = useTimeSummary(selectedUserId, weekOf);

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
                if (selectedUserId && teamId) {
                  window.open(`/api/v1/teams/${teamId}/time/export?userId=${selectedUserId}&weekOf=${weekOf}`, '_blank');
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
            <div className="font-mono text-[13px] text-blue mb-4">
              @{selectedUserId?.slice(-6)}
            </div>

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
