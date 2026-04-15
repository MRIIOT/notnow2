'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api, API_URL } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DetailPane } from '@/components/layout/DetailPane';

import { useUIStore } from '@/stores/uiStore';
import type { Team, User } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, activeTeamId, setAuth, setTeams } = useAuthStore();
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const router = useRouter();
  const [ready, setReady] = useState(false);


  useEffect(() => {
    async function init() {
      if (!user) {
        // Try to restore session via refresh
        try {
          const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
          if (!refreshRes.ok) {
            router.replace('/auth/login');
            return;
          }
          const { accessToken } = await refreshRes.json();
          // Set token first so api() can use it for the /me call
          useAuthStore.getState().setToken(accessToken);
          const meRes = await api<{ user: User }>('/auth/me');
          setAuth(meRes.user, accessToken);
        } catch {
          router.replace('/auth/login');
          return;
        }
      }
      // Load teams
      try {
        const data = await api<{ teams: Team[] }>('/teams');
        setTeams(data.teams);
        if (data.teams.length === 0) {
          router.replace('/auth/onboarding');
          return;
        }
      } catch {
        router.replace('/auth/login');
        return;
      }
      setReady(true);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <span className="font-mono text-text-tertiary text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        {selectedTaskId && <DetailPane />}
      </div>
    </div>
  );
}
