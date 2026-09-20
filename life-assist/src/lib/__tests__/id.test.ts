import { describe, it, expect } from 'vitest';
import { createId } from '@/lib/id';

describe('createId', () => {
  it('produces a non-empty string', () => {
    expect(createId().length).toBeGreaterThan(0);
  });

  it('produces unique values across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });
});
