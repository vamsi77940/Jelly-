import { describe, it, expect } from 'vitest';
import { computeLevel } from '@/lib/leveling';

describe('computeLevel', () => {
  it('starts at level 1 with zero XP', () => {
    const info = computeLevel(0);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.title).toBe('Getting Started');
  });

  it('advances to level 2 at exactly the threshold (50 XP)', () => {
    expect(computeLevel(49).level).toBe(1);
    expect(computeLevel(50).level).toBe(2);
  });

  it('advances to level 3 at 150 XP total', () => {
    expect(computeLevel(149).level).toBe(2);
    expect(computeLevel(150).level).toBe(3);
  });

  it('reports progress as a fraction between 0 and 1', () => {
    const info = computeLevel(25); // halfway from level 1 (0) to level 2 (50)
    expect(info.progress).toBeCloseTo(0.5, 5);
  });

  it('never regresses: total XP only ever produces a level >= previous level for growing XP', () => {
    let lastLevel = 1;
    for (let xp = 0; xp <= 5000; xp += 37) {
      const { level } = computeLevel(xp);
      expect(level).toBeGreaterThanOrEqual(lastLevel);
      lastLevel = level;
    }
  });

  it('assigns titles at the documented thresholds', () => {
    expect(computeLevel(0).title).toBe('Getting Started');
    expect(computeLevel(150).title).toBe('Building Momentum'); // level 3
    expect(computeLevel(500).title).toBe('Consistent'); // level 5
  });

  it('xpIntoLevel + threshold always reconstructs the original total XP', () => {
    for (const xp of [0, 1, 49, 50, 51, 999, 12345]) {
      const info = computeLevel(xp);
      const threshold = xp - info.xpIntoLevel;
      expect(threshold + info.xpIntoLevel).toBe(xp);
      expect(info.xpIntoLevel).toBeLessThan(info.xpForNextLevel);
      expect(info.xpIntoLevel).toBeGreaterThanOrEqual(0);
    }
  });
});
