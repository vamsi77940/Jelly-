import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshHabitsStore() {
  vi.resetModules();
  const { useHabitsStore } = await import('@/store/useHabitsStore');
  return useHabitsStore;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useHabitsStore streak math', () => {
  it('a habit with no check-ins has a streak of 0', async () => {
    const useHabitsStore = await freshHabitsStore();
    const habit = useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    expect(useHabitsStore.getState().currentStreak(useHabitsStore.getState().habits[0])).toBe(0);
    expect(habit.checkIns).toEqual([]);
  });

  it('checking in today gives a streak of 1', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T09:00:00'));
    const useHabitsStore = await freshHabitsStore();
    useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    const id = useHabitsStore.getState().habits[0].id;

    useHabitsStore.getState().toggleToday(id);

    const habit = useHabitsStore.getState().habits[0];
    expect(useHabitsStore.getState().currentStreak(habit)).toBe(1);
  });

  it('an unbroken run of consecutive days counts correctly, including today not yet checked in', async () => {
    const useHabitsStore = await freshHabitsStore();
    useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    const id = useHabitsStore.getState().habits[0].id;

    // Manually seed 3 consecutive prior days ending yesterday, today not yet checked.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T08:00:00'));
    const store = useHabitsStore.getState();
    const seeded = store.habits.map((h) =>
      h.id === id ? { ...h, checkIns: ['2026-07-12', '2026-07-13', '2026-07-14'] } : h
    );
    useHabitsStore.setState({ habits: seeded });

    const habit = useHabitsStore.getState().habits[0];
    expect(useHabitsStore.getState().currentStreak(habit)).toBe(3);
  });

  it('a gap breaks the streak', async () => {
    const useHabitsStore = await freshHabitsStore();
    useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    const id = useHabitsStore.getState().habits[0].id;

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T08:00:00'));
    const store = useHabitsStore.getState();
    const seeded = store.habits.map((h) =>
      // gap on the 13th breaks continuity back from the 14th
      h.id === id ? { ...h, checkIns: ['2026-07-10', '2026-07-11', '2026-07-14'] } : h
    );
    useHabitsStore.setState({ habits: seeded });

    const habit = useHabitsStore.getState().habits[0];
    expect(useHabitsStore.getState().currentStreak(habit)).toBe(1); // just the 14th
  });

  it('weeklyProgress only counts check-ins from this week (Monday-based)', async () => {
    vi.useFakeTimers();
    // 2026-07-15 is a Wednesday
    vi.setSystemTime(new Date('2026-07-15T08:00:00'));
    const useHabitsStore = await freshHabitsStore();
    useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    const id = useHabitsStore.getState().habits[0].id;

    const store = useHabitsStore.getState();
    const seeded = store.habits.map((h) =>
      h.id === id
        ? {
            ...h,
            checkIns: [
              '2026-07-13', // Monday this week
              '2026-07-14', // Tuesday this week
              '2026-07-06', // Monday last week — should not count
            ],
          }
        : h
    );
    useHabitsStore.setState({ habits: seeded });

    const habit = useHabitsStore.getState().habits[0];
    expect(useHabitsStore.getState().weeklyProgress(habit)).toBe(2);
  });

  it('toggling the same day twice removes the check-in (undo)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T08:00:00'));
    const useHabitsStore = await freshHabitsStore();
    useHabitsStore.getState().addHabit({ name: 'Read', targetPerWeek: 7, color: 'cyan' });
    const id = useHabitsStore.getState().habits[0].id;

    useHabitsStore.getState().toggleToday(id);
    expect(useHabitsStore.getState().habits[0].checkIns).toContain('2026-07-15');

    useHabitsStore.getState().toggleToday(id);
    expect(useHabitsStore.getState().habits[0].checkIns).not.toContain('2026-07-15');
  });
});
