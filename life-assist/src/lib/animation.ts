import type { CSSProperties } from 'react';

/**
 * Inline style for the Nth item in an animated list — pairs with the
 * `animate-fadeUp` class. Caps the delay so a long list doesn't take
 * seconds to finish revealing itself; items past the cap all animate
 * together at the max delay instead of stretching further.
 *
 * Usage: <TaskRow key={task.id} style={listStagger(index)} ... />
 */
export function listStagger(index: number, stepMs = 35, maxMs = 280): CSSProperties {
  return { animationDelay: `${Math.min(index * stepMs, maxMs)}ms` };
}
