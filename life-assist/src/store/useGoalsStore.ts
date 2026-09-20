import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { Goal, GoalType } from '@/types';

interface NewGoalInput {
  title: string;
  goalType: GoalType;
  targetDate: string | null;
  weekOf: string | null;
  monthOf: string | null;
  milestoneTexts: string[];
  autoReschedule: boolean;
}

interface GoalsState {
  goals: Goal[];
  hydrate: () => void;
  addGoal: (input: NewGoalInput) => Goal;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  goalProgress: (goal: Goal) => number;
  rescheduleOverdue: () => Goal[];
  linkEvents: (goalId: string, eventIds: string[]) => void;
}

function persist(goals: Goal[]) {
  writeJSON('goals', goals);
}

/** Get the ISO Monday of the current week */
function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Get next week's Monday */
function nextWeekMonday(weekOf: string): string {
  const d = new Date(weekOf + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

/** Get next month string from "YYYY-MM" */
function nextMonth(monthOf: string): string {
  const [y, m] = monthOf.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return next;
}

/** Migrate legacy goal shape (no goalType etc) to new shape */
function migrate(raw: any[]): Goal[] {
  return raw.map((g) => ({
    goalType: 'ongoing' as GoalType,
    weekOf: null,
    monthOf: null,
    autoReschedule: false,
    scheduledEventIds: [],
    ...g,
  }));
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: migrate(readJSON<any[]>('goals', [])),

  hydrate: () => set({ goals: migrate(readJSON<any[]>('goals', [])) }),

  addGoal: (input) => {
    const goal: Goal = {
      id: createId(),
      title: input.title.trim(),
      goalType: input.goalType,
      targetDate: input.targetDate,
      weekOf: input.weekOf,
      monthOf: input.monthOf,
      milestones: input.milestoneTexts
        .filter((t) => t.trim().length > 0)
        .map((text) => ({ id: createId(), text: text.trim(), completed: false })),
      createdAt: new Date().toISOString(),
      archived: false,
      autoReschedule: input.autoReschedule,
      scheduledEventIds: [],
    };
    const goals = [...get().goals, goal];
    set({ goals });
    persist(goals);
    return goal;
  },

  deleteGoal: (id) => {
    const goals = get().goals.filter((g) => g.id !== id);
    set({ goals });
    persist(goals);
  },

  archiveGoal: (id) => {
    const goals = get().goals.map((g) => (g.id === id ? { ...g, archived: true } : g));
    set({ goals });
    persist(goals);
  },

  toggleMilestone: (goalId, milestoneId) => {
    const goals = get().goals.map((g) =>
      g.id !== goalId
        ? g
        : {
            ...g,
            milestones: g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            ),
          }
    );
    set({ goals });
    persist(goals);
  },

  goalProgress: (goal) => {
    if (goal.milestones.length === 0) return 0;
    const done = goal.milestones.filter((m) => m.completed).length;
    return Math.round((done / goal.milestones.length) * 100);
  },

  rescheduleOverdue: () => {
    const today = new Date().toISOString().split('T')[0];
    const todayYM = today.slice(0, 7);
    const thisMonday = currentWeekMonday();
    const goals = get().goals;
    const rescheduled: Goal[] = [];

    const updated = goals.map((g) => {
      if (g.archived || !g.autoReschedule) return g;

      const progress = g.milestones.length === 0
        ? 100
        : Math.round((g.milestones.filter((m) => m.completed).length / g.milestones.length) * 100);
      if (progress === 100) return g;

      if (g.goalType === 'weekly' && g.weekOf && g.weekOf < thisMonday) {
        const moved: Goal = {
          ...g,
          weekOf: nextWeekMonday(g.weekOf),
          milestones: g.milestones.map((m) => ({ ...m, completed: false })),
        };
        rescheduled.push(moved);
        return moved;
      }
      if (g.goalType === 'monthly' && g.monthOf && g.monthOf < todayYM) {
        const moved: Goal = {
          ...g,
          monthOf: nextMonth(g.monthOf),
          milestones: g.milestones.map((m) => ({ ...m, completed: false })),
        };
        rescheduled.push(moved);
        return moved;
      }
      return g;
    });

    if (rescheduled.length > 0) {
      set({ goals: updated });
      persist(updated);
    }
    return rescheduled;
  },

  linkEvents: (goalId, eventIds) => {
    const goals = get().goals.map((g) =>
      g.id === goalId ? { ...g, scheduledEventIds: [...g.scheduledEventIds, ...eventIds] } : g
    );
    set({ goals });
    persist(goals);
  },
}));
