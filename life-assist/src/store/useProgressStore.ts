import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';

import { toLocalDateString } from '@/lib/time';

function todayKey(): string {
  return toLocalDateString();
}

export interface BestDay {
  date: string;
  xp: number;
}

interface ProgressState {
  dailyXp: Record<string, number>; // dateKey -> xp earned that day
  peakStreak: number; // longest daily-activity streak ever reached
  hydrate: () => void;
  addXp: (amount: number) => void;
  totalXp: () => number;
  currentStreak: () => number;
  bestDay: () => BestDay | null;
}

function persist(dailyXp: Record<string, number>, peakStreak: number) {
  writeJSON('progressDailyXp', dailyXp);
  writeJSON('progressPeakStreak', peakStreak);
}

function computeStreak(dailyXp: Record<string, number>): number {
  let streak = 0;
  const cursor = new Date();
  const hasToday = (dailyXp[todayKey()] ?? 0) > 0;
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  while ((dailyXp[toLocalDateString(cursor)] ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  dailyXp: readJSON<Record<string, number>>('progressDailyXp', {}),
  peakStreak: readJSON<number>('progressPeakStreak', 0),

  hydrate: () =>
    set({
      dailyXp: readJSON<Record<string, number>>('progressDailyXp', {}),
      peakStreak: readJSON<number>('progressPeakStreak', 0),
    }),

  addXp: (amount) => {
    const today = todayKey();
    const dailyXp = { ...get().dailyXp, [today]: (get().dailyXp[today] ?? 0) + amount };
    const streak = computeStreak(dailyXp);
    const peakStreak = Math.max(get().peakStreak, streak);
    set({ dailyXp, peakStreak });
    persist(dailyXp, peakStreak);
  },

  totalXp: () => Object.values(get().dailyXp).reduce((sum, v) => sum + v, 0),

  currentStreak: () => computeStreak(get().dailyXp),

  bestDay: () => {
    const entries = Object.entries(get().dailyXp);
    if (entries.length === 0) return null;
    const [date, xp] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
    return { date, xp };
  },
}));
