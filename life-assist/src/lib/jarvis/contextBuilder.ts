import { useMemo } from 'react';
import { useTasksStore } from '@/store/useTasksStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useRemindersStore } from '@/store/useRemindersStore';
import { toLocalDateString } from '@/lib/time';
import type { Goal, Habit, Task } from '@/types';

export interface DailyContext {
  now: Date;
  hour: number;
  todayKey: string;
  tasksOverdue: Task[];
  tasksDueToday: Task[];
  tasksDueTomorrow: Task[];
  percentComplete: number; // overall completion, matches what the Dashboard shows
  totalTasks: number;
  habitsUncheckedToday: Habit[];
  currentStreak: number;
  xpEarnedToday: number;
  focusSessionsToday: number;
  goalsNearDeadline: Goal[]; // within 3 days, not fully complete
  lastActivityHoursAgo: number | null; // null = nothing completed yet today
  morningAlarmTime: string | null; // only if enabled
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function useDailyContext(): DailyContext {
  const tasks = useTasksStore((s) => s.tasks);
  const habits = useHabitsStore((s) => s.habits);
  const goals = useGoalsStore((s) => s.goals);
  const goalProgress = useGoalsStore((s) => s.goalProgress);
  const focusSessionLog = useFocusStore((s) => s.sessionLog);
  const dailyXp = useProgressStore((s) => s.dailyXp);
  const currentStreak = useProgressStore((s) => s.currentStreak());
  const morningAlarm = useRemindersStore((s) => s.morningAlarm);

  return useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const todayKey = toLocalDateString(now);
    const tomorrowKey = toLocalDateString(tomorrow);

    const tasksOverdue = tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate < todayKey
    );
    const tasksDueToday = tasks.filter((t) => !t.completed && t.dueDate === todayKey);
    const tasksDueTomorrow = tasks.filter((t) => !t.completed && t.dueDate === tomorrowKey);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const percentComplete = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const habitsUncheckedToday = habits.filter((h) => !h.checkIns.includes(todayKey));

    const goalsNearDeadline = goals.filter((g) => {
      if (!g.targetDate || g.archived) return false;
      if (goalProgress(g) >= 100) return false;
      const diff = daysBetween(new Date(), new Date(g.targetDate));
      return diff >= 0 && diff <= 3;
    });

    const focusSessionsToday = focusSessionLog.filter((ts) => ts.slice(0, 10) === todayKey).length;
    const xpEarnedToday = dailyXp[todayKey] ?? 0;

    // Best-effort "last activity" from focus session timestamps and task
    // completion timestamps today — the only two signals with real clock
    // times (habit check-ins only store a date, not a time).
    const completionTimestampsToday: number[] = [
      ...focusSessionLog.filter((ts) => ts.slice(0, 10) === todayKey).map((ts) => new Date(ts).getTime()),
      ...tasks
        .filter((t) => t.completedAt && t.completedAt.slice(0, 10) === todayKey)
        .map((t) => new Date(t.completedAt as string).getTime()),
    ];
    const lastActivityHoursAgo =
      completionTimestampsToday.length === 0
        ? null
        : (now.getTime() - Math.max(...completionTimestampsToday)) / 3_600_000;

    return {
      now,
      hour: now.getHours(),
      todayKey,
      tasksOverdue,
      tasksDueToday,
      tasksDueTomorrow,
      percentComplete,
      totalTasks,
      habitsUncheckedToday,
      currentStreak,
      xpEarnedToday,
      focusSessionsToday,
      goalsNearDeadline,
      lastActivityHoursAgo,
      morningAlarmTime: morningAlarm.enabled ? morningAlarm.time : null,
    };
  }, [tasks, habits, goals, goalProgress, focusSessionLog, dailyXp, currentStreak, morningAlarm]);
}
