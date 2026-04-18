'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

interface MessageCountsData {
  counts: Record<string, number>;
  unread: Record<string, boolean>;
}

export function useMessageCounts() {
  const teamId = useAuthStore((s) => s.activeTeamId);

  const { data } = useQuery({
    queryKey: ['message-counts', teamId],
    queryFn: () => api<MessageCountsData>(`/teams/${teamId}/message-counts`),
    enabled: !!teamId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    counts: data?.counts || {},
    unread: data?.unread || {},
    unreadCount: data ? Object.values(data.unread).filter(Boolean).length : 0,
  };
}
