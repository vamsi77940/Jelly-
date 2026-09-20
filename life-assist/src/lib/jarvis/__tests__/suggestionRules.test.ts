import { describe, it, expect } from 'vitest';
import { generateSuggestions } from '@/lib/jarvis/suggestionRules';
import type { DailyContext } from '@/lib/jarvis/contextBuilder';

function baseContext(overrides: Partial<DailyContext> = {}): DailyContext {
  return {
    now: new Date('2026-07-15T10:00:00'),
    hour: 10,
    todayKey: '2026-07-15',
    tasksOverdue: [],
    tasksDueToday: [],
    tasksDueTomorrow: [],
    percentComplete: 0,
    totalTasks: 0,
    habitsUncheckedToday: [],
    currentStreak: 0,
    xpEarnedToday: 0,
    focusSessionsToday: 0,
    goalsNearDeadline: [],
    lastActivityHoursAgo: null,
    morningAlarmTime: null,
    ...overrides,
  };
}

describe('generateSuggestions', () => {
  it('returns nothing when there is genuinely nothing to say', () => {
    const result = generateSuggestions(baseContext(), 'friendly', new Set());
    expect(result).toEqual([]);
  });

  it('surfaces an overdue-task suggestion at high priority', () => {
    const ctx = baseContext({
      tasksOverdue: [
        { id: '1', title: 'Pay rent', dueDate: '2026-07-10', dueTime: null, priority: 'high', repeat: 'none', completed: false, createdAt: '', completedAt: null },
      ],
    });
    const result = generateSuggestions(ctx, 'friendly', new Set());
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('high');
    expect(result[0].actionTo).toBe('/tasks');
  });

  it('respects dismissal — a dismissed suggestion id never reappears', () => {
    const ctx = baseContext({
      tasksOverdue: [
        { id: '1', title: 'Pay rent', dueDate: '2026-07-10', dueTime: null, priority: 'high', repeat: 'none', completed: false, createdAt: '', completedAt: null },
      ],
    });
    const result = generateSuggestions(ctx, 'friendly', new Set(['overdue']));
    expect(result).toEqual([]);
  });

  it('caps results at maxResults even if more rules would fire', () => {
    const ctx = baseContext({
      tasksOverdue: [
        { id: '1', title: 'A', dueDate: '2026-07-10', dueTime: null, priority: 'high', repeat: 'none', completed: false, createdAt: '', completedAt: null },
      ],
      totalTasks: 4,
      percentComplete: 75,
      hour: 19,
      habitsUncheckedToday: [
        { id: 'h1', name: 'Read', targetPerWeek: 7, color: 'cyan', createdAt: '', checkIns: [] },
      ],
      currentStreak: 5,
      xpEarnedToday: 0,
    });
    const result = generateSuggestions(ctx, 'friendly', new Set(), 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('sorts high priority before medium and low', () => {
    const ctx = baseContext({
      tasksOverdue: [
        { id: '1', title: 'A', dueDate: '2026-07-10', dueTime: null, priority: 'high', repeat: 'none', completed: false, createdAt: '', completedAt: null },
      ],
      totalTasks: 4,
      percentComplete: 75, // fires progress-checkpoint (medium)
    });
    const result = generateSuggestions(ctx, 'friendly', new Set(), 5);
    const priorities = result.map((s) => s.priority);
    const highIndex = priorities.indexOf('high');
    const mediumIndex = priorities.indexOf('medium');
    if (highIndex !== -1 && mediumIndex !== -1) {
      expect(highIndex).toBeLessThan(mediumIndex);
    }
  });

  it('does not fire the all-done celebration when there are no tasks at all', () => {
    const result = generateSuggestions(baseContext({ totalTasks: 0, percentComplete: 0 }), 'friendly', new Set());
    expect(result.find((s) => s.id === 'all-done')).toBeUndefined();
  });

  it('fires the all-done celebration only at exactly 100% with at least one task', () => {
    const result = generateSuggestions(
      baseContext({ totalTasks: 3, percentComplete: 100 }),
      'motivational',
      new Set()
    );
    expect(result.find((s) => s.id === 'all-done')).toBeDefined();
  });

  it('produces different wording per tone for the same context', () => {
    const ctx = baseContext({
      tasksOverdue: [
        { id: '1', title: 'A', dueDate: '2026-07-10', dueTime: null, priority: 'high', repeat: 'none', completed: false, createdAt: '', completedAt: null },
      ],
    });
    const friendly = generateSuggestions(ctx, 'friendly', new Set())[0].text;
    const professional = generateSuggestions(ctx, 'professional', new Set())[0].text;
    expect(friendly).not.toBe(professional);
  });
});
