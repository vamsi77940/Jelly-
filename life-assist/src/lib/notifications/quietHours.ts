/** Minutes since midnight for an "HH:mm" string. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * True if `now` falls within the [start, end) quiet-hours window. Handles
 * the overnight case correctly — e.g. start="22:00", end="07:00" spans
 * midnight, which a naive `start <= now && now < end` comparison gets wrong.
 */
export function isWithinQuietHours(now: Date, start: string, end: string): boolean {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (startMinutes === endMinutes) return false; // zero-width window = never quiet

  if (startMinutes < endMinutes) {
    // Same-day window, e.g. 13:00-14:00
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Overnight window, e.g. 22:00-07:00
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}
