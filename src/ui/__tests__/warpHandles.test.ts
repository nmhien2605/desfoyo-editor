import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { listHandles, movePathPoint } from '../WarpHandlesOverlay';

const path: WarpPath = {
  role: 'baseline',
  closed: false,
  anchors: [
    { x: 0, y: 0.9, out: { x: 0.2, y: 0.9 } },
    { x: 0.5, y: 0.8, in: { x: 0.35, y: 0.83 }, out: { x: 0.65, y: 0.77 } },
    { x: 1, y: 0.86, in: { x: 0.75, y: 0.72 } },
  ],
};

describe('listHandles', () => {
  it('liet ke dung 7 point: 3 anchor + 4 handle', () => {
    const handles = listHandles(path);
    expect(handles).toHaveLength(7);
    expect(handles.filter((h) => h.kind === 'anchor')).toHaveLength(3);
    expect(handles.filter((h) => h.kind !== 'anchor')).toHaveLength(4);
  });
});

describe('movePathPoint', () => {
  it('keo handle chi doi handle do', () => {
    const next = movePathPoint(path, { anchor: 0, kind: 'out' }, { x: 0.1, y: -0.05 });
    expect(next.anchors[0].out!.x).toBeCloseTo(0.3, 10);
    expect(next.anchors[0].out!.y).toBeCloseTo(0.85, 10);
    expect(next.anchors[0].x).toBe(0);
    expect(next.anchors[0].y).toBe(0.9);
  });

  it('keo anchor keo theo ca hai handle cua no', () => {
    const next = movePathPoint(path, { anchor: 1, kind: 'anchor' }, { x: 0.1, y: 0.1 });
    expect(next.anchors[1].x).toBeCloseTo(0.6, 10);
    expect(next.anchors[1].y).toBeCloseTo(0.9, 10);
    expect(next.anchors[1].in!.x).toBeCloseTo(0.45, 10);
    expect(next.anchors[1].in!.y).toBeCloseTo(0.93, 10);
    expect(next.anchors[1].out!.x).toBeCloseTo(0.75, 10);
    expect(next.anchors[1].out!.y).toBeCloseTo(0.87, 10);
  });

  it('keo anchor0 (chi co out): anchor va out cung doi, in van undefined', () => {
    const next = movePathPoint(path, { anchor: 0, kind: 'anchor' }, { x: 0.2, y: -0.1 });
    expect(next.anchors[0].x).toBeCloseTo(0.2, 10);
    expect(next.anchors[0].y).toBeCloseTo(0.8, 10);
    expect(next.anchors[0].out!.x).toBeCloseTo(0.4, 10);
    expect(next.anchors[0].out!.y).toBeCloseTo(0.8, 10);
    expect(next.anchors[0].in).toBeUndefined();
  });

  it('keo anchor2 (chi co in): anchor va in cung doi, out van undefined', () => {
    const next = movePathPoint(path, { anchor: 2, kind: 'anchor' }, { x: -0.15, y: 0.05 });
    expect(next.anchors[2].x).toBeCloseTo(0.85, 10);
    expect(next.anchors[2].y).toBeCloseTo(0.91, 10);
    expect(next.anchors[2].in!.x).toBeCloseTo(0.6, 10);
    expect(next.anchors[2].in!.y).toBeCloseTo(0.77, 10);
    expect(next.anchors[2].out).toBeUndefined();
  });

  it('khong dung toi cac anchor khac', () => {
    const next = movePathPoint(path, { anchor: 1, kind: 'anchor' }, { x: 0.1, y: 0.1 });
    expect(next.anchors[0]).toEqual(path.anchors[0]);
    expect(next.anchors[2]).toEqual(path.anchors[2]);
  });

  it('khong sua path goc', () => {
    const before = JSON.stringify(path);
    movePathPoint(path, { anchor: 0, kind: 'anchor' }, { x: 1, y: 1 });
    expect(JSON.stringify(path)).toBe(before);
  });
});
