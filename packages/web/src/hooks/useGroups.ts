'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Group } from '@/types';

export function useGroups() {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const qc = useQueryClient();
  const queryKey = ['groups', teamId];

  const query = useQuery({
    queryKey,
    queryFn: () => api<{ groups: Group[] }>(`/teams/${teamId}/groups`).then((d) => d.groups),
    enabled: !!teamId,
  });

  const createGroup = useMutation({
    mutationFn: (name: string) =>
      api<{ group: Group }>(`/teams/${teamId}/groups`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const reorderGroups = useMutation({
    mutationFn: (orderedIds: string[]) =>
      api(`/teams/${teamId}/groups/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Group[]>(queryKey);
      if (prev) {
        const reordered = orderedIds
          .map((id) => prev.find((g) => g._id === id))
          .filter(Boolean) as Group[];
        qc.setQueryData<Group[]>(queryKey, reordered);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const renameGroup = useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      api(`/teams/${teamId}/groups/${groupId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId: string) =>
      api(`/teams/${teamId}/groups/${groupId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { groups: query.data || [], isLoading: query.isLoading, createGroup, reorderGroups, renameGroup, deleteGroup };
}
