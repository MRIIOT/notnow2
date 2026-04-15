'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Team } from '@/types';

export function useTeam() {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();
  const queryKey = ['team', teamId];

  const query = useQuery({
    queryKey,
    queryFn: () => api<{ team: Team }>(`/teams/${teamId}`).then((d) => d.team),
    enabled: !!teamId,
  });

  const addMember = useMutation({
    mutationFn: (data: { username: string; role?: string }) =>
      api(`/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateMember = useMutation({
    mutationFn: ({ userId, ...data }: { userId: string; role?: string }) =>
      api(`/teams/${teamId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    team: query.data || null,
    isLoading: query.isLoading,
    addMember,
    updateMember,
    removeMember,
  };
}
