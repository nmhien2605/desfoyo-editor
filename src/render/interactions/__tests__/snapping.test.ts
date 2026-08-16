import { describe, expect, it } from 'vitest';
import { computeSnap } from '../snapping';
import type { SelectionBounds } from '../groupTransformMath';

function bounds(minX: number, minY: number, maxX: number, maxY: number): SelectionBounds {
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY }, pivot: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } };
}

describe('computeSnap', () => {
  it('snaps a left edge to a nearby candidate left edge within threshold', () => {
    const moving = bounds(103, 0, 123, 20); // left edge at 103
    const candidate = bounds(100, 0, 120, 20); // left edge at 100
    const result = computeSnap(moving, [candidate], 6);
    expect(result.delta.x).toBeCloseTo(-3);
    expect(result.guides).toContainEqual({ axis: 'x', value: 100 });
  });

  it('snaps centers together', () => {
    const moving = bounds(48, 0, 68, 20); // center x = 58
    const candidate = bounds(0, 0, 120, 20); // center x = 60
    const result = computeSnap(moving, [candidate], 6);
    expect(result.delta.x).toBeCloseTo(2);
    expect(result.guides).toContainEqual({ axis: 'x', value: 60 });
  });

  it('does not snap when nothing is within threshold', () => {
    const moving = bounds(0, 0, 20, 20);
    const candidate = bounds(1000, 1000, 1020, 1020);
    const result = computeSnap(moving, [candidate], 6);
    expect(result.delta).toEqual({ x: 0, y: 0 });
    expect(result.guides).toEqual([]);
  });

  it('snaps x and y independently', () => {
    const moving = bounds(4, 96, 24, 116); // left=4 (near candidate left=0), top=96 (near candidate top=100)
    const candidate = bounds(0, 100, 20, 120);
    const result = computeSnap(moving, [candidate], 6);
    expect(result.delta.x).toBeCloseTo(-4);
    expect(result.delta.y).toBeCloseTo(4);
  });
});
