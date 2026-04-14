'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { User, Team } from '@/types';

export function useAuth() {
  const { user, activeTeamId, teams, setAuth, setTeams, setActiveTeam, logout: clearAuth } = useAuthStore();
  const router = useRouter();

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await api<{ user: User; accessToken: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      setAuth(data.user, data.accessToken);
      return data.user;
    },
    [setAuth],
  );

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const data = await api<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password }),
      });
      setAuth(data.user, data.accessToken);
      return data.user;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuth();
    router.push('/auth/login');
  }, [clearAuth, router]);

  const loadTeams = useCallback(async () => {
    const data = await api<{ teams: Team[] }>('/teams');
    setTeams(data.teams);
    return data.teams;
  }, [setTeams]);

  const createTeam = useCallback(
    async (handle: string, displayName: string) => {
      const data = await api<{ team: Team }>('/teams', {
        method: 'POST',
        body: JSON.stringify({ handle, displayName }),
      });
      await loadTeams();
      setActiveTeam(data.team._id);
      return data.team;
    },
    [loadTeams, setActiveTeam],
  );

  const checkHandle = useCallback(async (handle: string) => {
    const data = await api<{ available: boolean }>(`/auth/check-handle/${handle}`);
    return data.available;
  }, []);

  return {
    user,
    activeTeamId,
    teams,
    signup,
    login,
    logout,
    loadTeams,
    createTeam,
    setActiveTeam,
    checkHandle,
  };
}
