export interface CalendarDay {
  date: Date;
  key: string; // yyyy-mm-dd
  inCurrentMonth: boolean;
  isToday: boolean;
}

import { toLocalDateString } from '@/lib/time';

function toKey(date: Date): string {
  return toLocalDateString(date);
}

/** Builds a 6-week grid (42 days) for the given month, starting on Monday. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(year, month, 1 - startOffset);

  const today = toKey(new Date());
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push({
      date,
      key: toKey(date),
      inCurrentMonth: date.getMonth() === month,
      isToday: toKey(date) === today,
    });
  }
  return days;
}
