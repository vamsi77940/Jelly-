import { describe, it, expect } from 'vitest';
import { isWithinQuietHours } from '@/lib/notifications/quietHours';

describe('isWithinQuietHours', () => {
  it('handles a same-day window correctly', () => {
    expect(isWithinQuietHours(new Date('2026-07-15T13:30:00'), '13:00', '14:00')).toBe(true);
    expect(isWithinQuietHours(new Date('2026-07-15T14:30:00'), '13:00', '14:00')).toBe(false);
  });

  it('handles the overnight wraparound (22:00-07:00)', () => {
    expect(isWithinQuietHours(new Date('2026-07-15T23:00:00'), '22:00', '07:00')).toBe(true); // late night
    expect(isWithinQuietHours(new Date('2026-07-16T03:00:00'), '22:00', '07:00')).toBe(true); // past midnight
    expect(isWithinQuietHours(new Date('2026-07-16T06:59:00'), '22:00', '07:00')).toBe(true); // just before end
    expect(isWithinQuietHours(new Date('2026-07-16T07:00:00'), '22:00', '07:00')).toBe(false); // exactly at end
    expect(isWithinQuietHours(new Date('2026-07-16T12:00:00'), '22:00', '07:00')).toBe(false); // midday
    expect(isWithinQuietHours(new Date('2026-07-15T21:59:00'), '22:00', '07:00')).toBe(false); // just before start
  });

  it('treats a zero-width window as never quiet', () => {
    expect(isWithinQuietHours(new Date('2026-07-15T22:00:00'), '22:00', '22:00')).toBe(false);
  });
});
