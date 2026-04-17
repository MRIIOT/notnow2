'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export function useMessageCounts() {
  const teamId = useAuthStore((s) => s.activeTeamId);

  const { data } = useQuery({
    queryKey: ['message-counts', teamId],
    queryFn: () => api<{ counts: Record<string, number> }>(`/teams/${teamId}/message-counts`).then((d) => d.counts),
    enabled: !!teamId,
    staleTime: 60_000,
  });

  return data || {};
}
