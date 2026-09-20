import { describe, it, expect, vi, afterEach } from 'vitest';
import { isOverdue, isSameLocalDay, formatDayGreeting } from '@/lib/time';

describe('isOverdue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when there is no due date', () => {
    expect(isOverdue(null, null)).toBe(false);
  });

  it('treats a past date as overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00'));
    expect(isOverdue('2026-07-14', null)).toBe(true);
  });

  it('treats today with no time as due by end of day, not yet overdue mid-morning', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T09:00:00'));
    expect(isOverdue('2026-07-15', null)).toBe(false);
  });

  it('respects an explicit due time on today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00'));
    expect(isOverdue('2026-07-15', '09:00')).toBe(true);
    expect(isOverdue('2026-07-15', '18:00')).toBe(false);
  });
});

describe('isSameLocalDay', () => {
  it('is true for the same calendar day at different times', () => {
    expect(isSameLocalDay(new Date('2026-07-15T01:00:00'), new Date('2026-07-15T23:00:00'))).toBe(true);
  });

  it('is false across midnight', () => {
    expect(isSameLocalDay(new Date('2026-07-15T23:59:00'), new Date('2026-07-16T00:01:00'))).toBe(false);
  });
});

describe('formatDayGreeting', () => {
  it('greets morning, afternoon, evening, and late night distinctly', () => {
    expect(formatDayGreeting(new Date('2026-07-15T08:00:00'))).toBe('Good morning');
    expect(formatDayGreeting(new Date('2026-07-15T14:00:00'))).toBe('Good afternoon');
    expect(formatDayGreeting(new Date('2026-07-15T19:00:00'))).toBe('Good evening');
    expect(formatDayGreeting(new Date('2026-07-15T23:00:00'))).toBe('Good night, almost');
  });
});
