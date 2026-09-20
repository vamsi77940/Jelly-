import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';

import { toLocalDateString } from '@/lib/time';

function todayKey(): string {
  return toLocalDateString();
}

interface FocusState {
  sessionLog: string[]; // ISO timestamps, one per completed session
  hydrate: () => void;
  logCompletedSession: () => void;
  sessionsToday: () => number;
}

function persist(sessionLog: string[]) {
  writeJSON('focusSessionLog', sessionLog);
}

export const useFocusStore = create<FocusState>((set, get) => ({
  sessionLog: readJSON<string[]>('focusSessionLog', []),

  hydrate: () => set({ sessionLog: readJSON<string[]>('focusSessionLog', []) }),

  logCompletedSession: () => {
    const sessionLog = [...get().sessionLog, new Date().toISOString()];
    set({ sessionLog });
    persist(sessionLog);
  },

  sessionsToday: () => {
    const today = todayKey();
    return get().sessionLog.filter((ts) => ts.slice(0, 10) === today).length;
  },
}));
