import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NudgesState {
  dismissed: Record<string, string[]>; // dateKey -> suggestion ids dismissed that day
  hydrate: () => void;
  dismiss: (id: string) => void;
  dismissedToday: () => Set<string>;
}

function persist(dismissed: Record<string, string[]>) {
  writeJSON('nudgesDismissed', dismissed);
}

export const useNudgesStore = create<NudgesState>((set, get) => ({
  dismissed: readJSON<Record<string, string[]>>('nudgesDismissed', {}),

  hydrate: () => set({ dismissed: readJSON<Record<string, string[]>>('nudgesDismissed', {}) }),

  dismiss: (id) => {
    const today = todayKey();
    const dismissed = {
      ...get().dismissed,
      [today]: [...(get().dismissed[today] ?? []), id],
    };
    set({ dismissed });
    persist(dismissed);
  },

  dismissedToday: () => new Set(get().dismissed[todayKey()] ?? []),
}));
