import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshProgressStore() {
  vi.resetModules();
  const { useProgressStore } = await import('@/store/useProgressStore');
  return useProgressStore;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useProgressStore', () => {
  it('starts with zero XP, zero streak, and no best day', async () => {
    const useProgressStore = await freshProgressStore();
    const s = useProgressStore.getState();
    expect(s.totalXp()).toBe(0);
    expect(s.currentStreak()).toBe(0);
    expect(s.bestDay()).toBeNull();
  });

  it('addXp accumulates within the same day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T09:00:00'));
    const useProgressStore = await freshProgressStore();
    useProgressStore.getState().addXp(10);
    useProgressStore.getState().addXp(5);
    expect(useProgressStore.getState().totalXp()).toBe(15);
  });

  it('tracks the peak streak independently of the current streak (it never decreases)', async () => {
    const useProgressStore = await freshProgressStore();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T09:00:00'));
    useProgressStore.getState().addXp(10);
    vi.setSystemTime(new Date('2026-07-14T09:00:00'));
    useProgressStore.getState().addXp(10);
    vi.setSystemTime(new Date('2026-07-15T09:00:00'));
    useProgressStore.getState().addXp(10);
    expect(useProgressStore.getState().currentStreak()).toBe(3);
    expect(useProgressStore.getState().peakStreak).toBe(3);

    // Skip a day — current streak resets, but the peak record must remain.
    vi.setSystemTime(new Date('2026-07-17T09:00:00'));
    expect(useProgressStore.getState().currentStreak()).toBe(0);
    expect(useProgressStore.getState().peakStreak).toBe(3);
  });

  it('bestDay reports the single highest-XP day, not the total', async () => {
    const useProgressStore = await freshProgressStore();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T09:00:00'));
    useProgressStore.getState().addXp(10);
    vi.setSystemTime(new Date('2026-07-14T09:00:00'));
    useProgressStore.getState().addXp(50);
    vi.setSystemTime(new Date('2026-07-15T09:00:00'));
    useProgressStore.getState().addXp(5);

    const best = useProgressStore.getState().bestDay();
    expect(best).toEqual({ date: '2026-07-14', xp: 50 });
  });
});
