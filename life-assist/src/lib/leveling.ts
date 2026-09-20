/**
 * XP → level curve. Deliberately front-loaded (early levels come fast) so
 * the first few days feel rewarding, then eases into a steady climb.
 *
 * Design intent: this rewards real progress already made (tasks finished,
 * habits kept, focus sessions completed) — it never decays, never resets on
 * a missed day, and there's no mechanic that punishes stopping. A streak is
 * tracked separately (see useProgressStore) purely as a personal record,
 * not a loss the person is threatened with.
 */

// Cumulative XP required to REACH a given level. Increment from level L-1
// to L is 50 * (L-1), so the gap between levels grows linearly.
function cumulativeXpForLevel(level: number): number {
  return 25 * level * (level - 1);
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-1
  title: string;
}

const TITLE_THRESHOLDS: [number, string][] = [
  [1, 'Getting Started'],
  [3, 'Building Momentum'],
  [5, 'Consistent'],
  [8, 'Disciplined'],
  [12, 'Focused'],
  [16, 'Habitual'],
  [20, 'Systemized'],
  [25, 'Unstoppable'],
  [30, 'Legend'],
];

function titleForLevel(level: number): string {
  let title = TITLE_THRESHOLDS[0][1];
  for (const [threshold, t] of TITLE_THRESHOLDS) {
    if (level >= threshold) title = t;
  }
  return title;
}

export function computeLevel(totalXp: number): LevelInfo {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= totalXp) level++;

  const currentThreshold = cumulativeXpForLevel(level);
  const nextThreshold = cumulativeXpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel === 0 ? 0 : xpIntoLevel / xpForNextLevel,
    title: titleForLevel(level),
  };
}
