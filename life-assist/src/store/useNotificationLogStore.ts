import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NotificationLogState {
  sent: Record<string, string[]>; // dateKey -> suggestion ids already sent as OS notifications
  hydrate: () => void;
  markSent: (id: string) => void;
  sentToday: () => Set<string>;
  countToday: () => number;
}

function persist(sent: Record<string, string[]>) {
  writeJSON('notificationLog', sent);
}

export const useNotificationLogStore = create<NotificationLogState>((set, get) => ({
  sent: readJSON<Record<string, string[]>>('notificationLog', {}),

  hydrate: () => set({ sent: readJSON<Record<string, string[]>>('notificationLog', {}) }),

  markSent: (id) => {
    const today = todayKey();
    const sent = { ...get().sent, [today]: [...(get().sent[today] ?? []), id] };
    set({ sent });
    persist(sent);
  },

  sentToday: () => new Set(get().sent[todayKey()] ?? []),

  countToday: () => (get().sent[todayKey()] ?? []).length,
}));
