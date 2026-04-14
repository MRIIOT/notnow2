'use client';

import { create } from 'zustand';

interface UIState {
  selectedTaskId: string | null;
  selectTask: (taskId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTaskId: null,
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
}));
