'use client';

import { create } from 'zustand';
import type { User, Team } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  teams: Team[];
  activeTeamId: string | null;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  setTeams: (teams: Team[]) => void;
  setActiveTeam: (teamId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  teams: [],
  activeTeamId: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setToken: (accessToken) => set({ accessToken }),
  setTeams: (teams) =>
    set((state) => ({
      teams,
      activeTeamId: state.activeTeamId || teams[0]?._id || null,
    })),
  setActiveTeam: (teamId) => set({ activeTeamId: teamId }),
  logout: () => set({ user: null, accessToken: null, teams: [], activeTeamId: null }),
}));
