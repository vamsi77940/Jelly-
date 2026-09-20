import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { Habit } from '@/types';

import { toLocalDateString } from '@/lib/time';

function todayKey(): string {
  return toLocalDateString();
}

function startOfWeekKey(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return toLocalDateString(monday);
}

interface NewHabitInput {
  name: string;
  targetPerWeek: number;
  color: Habit['color'];
}

interface HabitsState {
  habits: Habit[];
  hydrate: () => void;
  addHabit: (input: NewHabitInput) => Habit;
  deleteHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  toggleDate: (id: string, date: string) => void;
  weeklyProgress: (habit: Habit) => number; // check-ins since Monday
  currentStreak: (habit: Habit) => number; // consecutive days up to today
  longestStreak: (habit: Habit) => number; // maximum consecutive days
}

function persist(habits: Habit[]) {
  writeJSON('habits', habits);
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: readJSON<Habit[]>('habits', []),

  hydrate: () => set({ habits: readJSON<Habit[]>('habits', []) }),

  addHabit: (input) => {
    const habit: Habit = {
      id: createId(),
      name: input.name.trim(),
      targetPerWeek: input.targetPerWeek,
      color: input.color,
      createdAt: new Date().toISOString(),
      checkIns: [],
    };
    const habits = [...get().habits, habit];
    set({ habits });
    persist(habits);
    return habit;
  },

  deleteHabit: (id) => {
    const habits = get().habits.filter((h) => h.id !== id);
    set({ habits });
    persist(habits);
  },

  toggleToday: (id) => {
    get().toggleDate(id, todayKey());
  },

  toggleDate: (id, date) => {
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h;
      const already = h.checkIns.includes(date);
      return {
        ...h,
        checkIns: already ? h.checkIns.filter((d) => d !== date) : [...h.checkIns, date],
      };
    });
    set({ habits });
    persist(habits);
  },

  weeklyProgress: (habit) => {
    const weekStart = startOfWeekKey();
    return habit.checkIns.filter((d) => d >= weekStart).length;
  },

  currentStreak: (habit) => {
    let streak = 0;
    const cursor = new Date();
    const checkIns = new Set(habit.checkIns);
    // A streak counts back from today; today not yet checked in doesn't
    // break a streak earned through yesterday, it just isn't counted yet.
    if (!checkIns.has(todayKey())) cursor.setDate(cursor.getDate() - 1);
    while (checkIns.has(toLocalDateString(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },

  longestStreak: (habit) => {
    const checkIns = [...habit.checkIns].sort();
    if (checkIns.length === 0) return 0;
    
    let longest = 1;
    let current = 1;
    
    for (let i = 1; i < checkIns.length; i++) {
      const prev = new Date(checkIns[i - 1]);
      const curr = new Date(checkIns[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        current++;
      } else if (diffDays > 1) {
        longest = Math.max(longest, current);
        current = 1;
      }
    }
    return Math.max(longest, current);
  },
}));
