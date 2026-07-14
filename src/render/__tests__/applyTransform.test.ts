// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { composeTransform, decomposeTransform } from '../applyTransform';
import type { Transform, Size } from '../../schema';

function approxEqual(a: number, b: number, epsilon = 1e-6) {
  return Math.abs(a - b) < epsilon;
}

function expectTransformClose(a: Transform, b: Transform) {
  expect(approxEqual(a.x, b.x)).toBe(true);
  expect(approxEqual(a.y, b.y)).toBe(true);
  expect(approxEqual(a.scaleX, b.scaleX)).toBe(true);
  expect(approxEqual(a.scaleY, b.scaleY)).toBe(true);
  expect(approxEqual(a.rotation, b.rotation)).toBe(true);
}

describe('composeTransform / decomposeTransform round-trip', () => {
  const cases: Array<{ parent: Transform; parentSize: Size; child: Transform; childSize: Size }> = [
    {
      parent: { x: 100, y: 50, scaleX: 1, scaleY: 1, rotation: Math.PI / 2, originX: 0.5, originY: 0.5 },
      parentSize: { width: 200, height: 200 },
      child: { x: 10, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
      childSize: { width: 20, height: 20 },
    },
    {
      parent: { x: 0, y: 0, scaleX: 2, scaleY: 2, rotation: 0, originX: 0, originY: 0 },
      parentSize: { width: 100, height: 100 },
      child: { x: 30, y: 40, scaleX: 1, scaleY: 1, rotation: 0.3, originX: 0.5, originY: 0.5 },
      childSize: { width: 10, height: 10 },
    },
    {
      parent: { x: 50, y: -20, scaleX: 1.5, scaleY: 0.8, rotation: -0.7, originX: 0.5, originY: 0.5 },
      parentSize: { width: 80, height: 80 },
      child: { x: -15, y: 25, scaleX: 1.2, scaleY: 1.2, rotation: 1.1, originX: 0, originY: 1 },
      childSize: { width: 40, height: 40 },
    },
  ];

  it('decompose(compose is the inverse) recovers the original child transform', () => {
    for (const { parent, parentSize, child, childSize } of cases) {
      // decomposeTransform expresses `child` (already expressed relative to
      // `parent`'s own outer space, i.e. "world") in `parent`'s local space.
      // composeTransform is the inverse: given that local transform, recover
      // the original world transform.
      const local = decomposeTransform(parent, parentSize, child, childSize);
      const recovered = composeTransform(parent, parentSize, local, childSize);
      expectTransformClose(recovered, child);
    }
  });

  it('group/ungroup round trip: composing then decomposing the same parent recovers the input unchanged', () => {
    for (const { parent, parentSize, child, childSize } of cases) {
      const world = composeTransform(parent, parentSize, child, childSize);
      const backToLocal = decomposeTransform(parent, parentSize, world, childSize);
      expectTransformClose(backToLocal, child);
    }
  });
});
