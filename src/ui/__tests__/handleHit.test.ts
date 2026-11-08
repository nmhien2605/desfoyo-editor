import { describe, expect, it } from 'vitest';
import { HIT_AREA_CLASS, POINT_HIT_EXTRA, handleHitSize } from '../WarpHandlesOverlay';

describe('handleHitSize', () => {
  it('fine pointers keep the visual size', () => {
    expect(handleHitSize(7, 500, false)).toBe(7);
  });

  it('coarse pointers get 24 px on normal objects', () => {
    expect(handleHitSize(7, 200, true)).toBe(24);
  });

  it('shrinks to half the shorter side on tiny objects, never below visual', () => {
    expect(handleHitSize(7, 30, true)).toBe(15);
    expect(handleHitSize(7, 4, true)).toBe(7);
  });

  it('warp/circle points reach past a coincident handle', () => {
    expect(handleHitSize(7, 200, true) + POINT_HIT_EXTRA).toBeGreaterThan(handleHitSize(7, 200, true));
    expect(HIT_AREA_CLASS).toContain('before:size-[var(--df-hit)]');
  });
});
