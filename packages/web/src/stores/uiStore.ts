'use client';

import { create } from 'zustand';

interface UIState {
  selectedTaskId: string | null;
  sidebarOpen: boolean;
  selectTask: (taskId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTaskId: null,
  sidebarOpen: false,
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
