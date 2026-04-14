'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Group } from '@/types';

export function useGroups() {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['groups', teamId],
    queryFn: () => api<{ groups: Group[] }>(`/teams/${teamId}/groups`).then((d) => d.groups),
    enabled: !!teamId,
  });

  const createGroup = useMutation({
    mutationFn: (name: string) =>
      api<{ group: Group }>(`/teams/${teamId}/groups`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', teamId] }),
  });

  return { groups: query.data || [], isLoading: query.isLoading, createGroup };
}
