'use client';

import { create } from 'zustand';

export type ActiveView = 'pipeline' | 'energy' | 'priority' | 'kanban' | 'group' | 'upcoming';

interface UIState {
  selectedTaskId: string | null;
  sidebarOpen: boolean;
  activeView: ActiveView;
  selectTask: (taskId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveView: (view: ActiveView) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTaskId: null,
  sidebarOpen: false,
  activeView: 'pipeline',
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
}));
