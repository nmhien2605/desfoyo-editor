import { describe, expect, it } from 'vitest';
import { computeScaleResize, rotateVector } from '../resizeMath';
import type { ShapeNode } from '../../../schema';

function node(transform: Partial<ShapeNode['transform']>): ShapeNode {
  return {
    id: 'n',
    type: 'shape',
    shape: 'rect',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, ...transform },
    size: { width: 100, height: 50 },
    opacity: 1,
    visible: true,
    locked: false,
  } as ShapeNode;
}

const BOX = { x: 0, y: 0, width: 100, height: 50 };

function worldOf(n: ShapeNode, t: { x: number; y: number; scaleX: number; scaleY: number }, local: { x: number; y: number }) {
  const px = (n.transform.originX ?? 0) * n.size.width;
  const py = (n.transform.originY ?? 0) * n.size.height;
  const o = rotateVector({ x: (local.x - px) * t.scaleX, y: (local.y - py) * t.scaleY }, n.transform.rotation);
  return { x: t.x + o.x, y: t.y + o.y };
}

describe('computeScaleResize', () => {
  it('se drag along the diagonal doubles the scale, nw corner fixed', () => {
    const r = computeScaleResize(node({}), 'se', { x: 100, y: 50 }, BOX);
    expect(r).toEqual({ scaleX: 2, scaleY: 2, x: 0, y: 0 });
  });

  it('keeps the opposite corner fixed when rotated, centred and pre-scaled', () => {
    const n = node({ x: 300, y: 200, rotation: 0.7, originX: 0.5, originY: 0.5, scaleX: 1.5, scaleY: 1.5 });
    const before = worldOf(n, n.transform, { x: 100, y: 50 });
    const r = computeScaleResize(n, 'nw', { x: -40, y: 25 }, BOX);
    const after = worldOf(n, r, { x: 100, y: 50 });
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(r.scaleX).toBeCloseTo(r.scaleY);
  });

  it('never collapses below the minimum scale', () => {
    const r = computeScaleResize(node({}), 'se', { x: -500, y: -500 }, BOX);
    expect(r.scaleX).toBeCloseTo(0.01);
  });

  it('s drag changes scaleY only, top edge fixed, x delta ignored', () => {
    const r = computeScaleResize(node({}), 's', { x: 30, y: 50 }, BOX);
    expect(r).toEqual({ scaleX: 1, scaleY: 2, x: 0, y: 0 });
  });

  it('e drag on a rotated, centred node changes scaleX only, w edge midpoint fixed', () => {
    const n = node({ x: 300, y: 200, rotation: 0.7, originX: 0.5, originY: 0.5, scaleY: 1.5 });
    const before = worldOf(n, n.transform, { x: 0, y: 25 });
    const r = computeScaleResize(n, 'e', { x: 40, y: 10 }, BOX);
    const after = worldOf(n, r, { x: 0, y: 25 });
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(r.scaleY).toBe(1.5);
    expect(r.scaleX).toBeGreaterThan(1);
  });

  it('w drag past the anchor clamps instead of flipping', () => {
    const r = computeScaleResize(node({}), 'w', { x: 500, y: 0 }, BOX);
    expect(r.scaleX).toBeCloseTo(0.01);
    expect(r.scaleY).toBe(1);
  });
});
