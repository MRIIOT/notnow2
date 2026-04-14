'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

interface TimeSummaryGroup {
  groupName: string;
  hours: number;
  rate: number; // cents
  entries: Array<{
    _id: string;
    hours: number;
    date: string;
    note: string;
    taskId: { _id: string; title: string } | null;
  }>;
}

interface TimeSummary {
  groups: TimeSummaryGroup[];
  totalHours: number;
  totalAmount: number; // cents
}

export function useTimeSummary(userId: string | null, weekOf: string) {
  const teamId = useAuthStore((s) => s.activeTeamId);

  return useQuery({
    queryKey: ['time-summary', teamId, userId, weekOf],
    queryFn: () =>
      api<TimeSummary>(`/teams/${teamId}/time/summary?userId=${userId}&weekOf=${weekOf}`),
    enabled: !!teamId && !!userId,
  });
}
