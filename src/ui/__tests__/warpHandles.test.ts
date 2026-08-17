import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { clampPathX, listHandles, movePathPoint, projectLocalPoint } from '../WarpHandlesOverlay';
import type { Viewport } from '../../render/viewport';
import { evalD1 } from '../../text/bezier';
import { buildWavePath } from '../../text/warp';

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

// projectLocalPoint la phep chieu pivot -> scale -> rotate -> translate ->
// camera dung cho handle warp tren node da xoay/scale — cung cong thuc
// worldPoint() trong SelectionOverlay.tsx dung, nhung chua tung co test tu
// dong nao bao ve no (chi duoc kiem tra thu cong tren node xoay khi review
// task 11). Cac so o day chon tron de tu tay tinh ra ket qua ky vong, khong
// phai goi lai chinh cong thuc dang test roi so khop voi chinh no:
//
//   local = (40, 0), pivot = (20, 10)  =>  local - pivot = (20, -10)
//   scale x2 ca hai truc               =>  (40, -20)
//   xoay 90 do (cos=0, sin=1):
//     x' = x*cos - y*sin = 40*0 - (-20)*1 = 20
//     y' = x*sin + y*cos = 40*1 + (-20)*0 = 40
//   offset = (20, 40); transform.x/y = (100, 200) => world = (120, 240)
//   camera zoom=2, pan=(10,5) => screen = world*zoom + pan = (250, 485)
describe('projectLocalPoint', () => {
  const viewport: Viewport = {
    toScreen: (p) => ({ x: p.x * 2 + 10, y: p.y * 2 + 5 }),
    toWorld: (p) => ({ x: (p.x - 10) / 2, y: (p.y - 5) / 2 }),
  };

  it('chieu dung toa do man hinh cho node da xoay 90 do va scale x2', () => {
    const screen = projectLocalPoint(
      { x: 40, y: 0 },
      { x: 20, y: 10 },
      { x: 100, y: 200, scaleX: 2, scaleY: 2, rotation: Math.PI / 2 },
      viewport,
    );
    expect(screen.x).toBeCloseTo(250, 8);
    expect(screen.y).toBeCloseTo(485, 8);
  });

  it('khong xoay/khong scale/khong pan thi local - pivot cong thang vao transform', () => {
    const identityViewport: Viewport = { toScreen: (p) => p, toWorld: (p) => p };
    const screen = projectLocalPoint(
      { x: 40, y: 0 },
      { x: 20, y: 10 },
      { x: 100, y: 200, scaleX: 1, scaleY: 1, rotation: 0 },
      identityViewport,
    );
    // (40-20, 0-10) = (20, -10) cong vao (100, 200) => (120, 190)
    expect(screen).toEqual({ x: 120, y: 190 });
  });
});

function isMonotoneX(path: WarpPath): boolean {
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = from.x;
    const c1 = (from.out ?? from).x;
    const c2 = (to.in ?? to).x;
    const p3 = to.x;
    for (let k = 0; k <= 200; k++) {
      if (evalD1(p0, c1, c2, p3, k / 200) < -1e-12) return false;
    }
  }
  return true;
}

describe('clampPathX', () => {
  it('ghim hai mep o 0 va 1', () => {
    const moved = movePathPoint(
      buildWavePath(0.5, 0.8),
      { anchor: 0, kind: 'anchor' },
      {
        x: 0.3,
        y: 0,
      },
    );
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].x).toBe(0);
    expect(clamped.anchors[clamped.anchors.length - 1].x).toBe(1);
  });

  it('anchor giua khong vuot qua anchor phai', () => {
    const moved = movePathPoint(
      buildWavePath(0.5, 0.8),
      { anchor: 1, kind: 'anchor' },
      {
        x: 0.9,
        y: 0,
      },
    );
    const clamped = clampPathX(moved);
    expect(clamped.anchors[1].x).toBeLessThanOrEqual(clamped.anchors[2].x);
  });

  it('handle bi keo vuot ra ngoai segment thi bi kep ve bien', () => {
    const moved = movePathPoint(
      buildWavePath(0.5, 0.8),
      { anchor: 0, kind: 'out' },
      {
        x: 2,
        y: 0,
      },
    );
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].out!.x).toBeLessThanOrEqual(clamped.anchors[1].x);
    expect(clamped.anchors[0].out!.x).toBeGreaterThanOrEqual(clamped.anchors[0].x);
  });

  it('keo anchor xong thi handle KE cua anchor lan can cung duoc kep lai', () => {
    // Keo anchor giua sang trai qua khoi handle `out` cua anchor 0 (x = 0.2).
    const moved = movePathPoint(
      buildWavePath(0.5, 0.8),
      { anchor: 1, kind: 'anchor' },
      {
        x: -0.4,
        y: 0,
      },
    );
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].out!.x).toBeLessThanOrEqual(clamped.anchors[1].x);
  });

  it('B10 — path sau khi kep luon don dieu theo x', () => {
    const drags: { anchor: number; kind: 'anchor' | 'in' | 'out' }[] = [
      { anchor: 1, kind: 'anchor' },
      { anchor: 0, kind: 'out' },
      { anchor: 2, kind: 'in' },
      { anchor: 1, kind: 'in' },
    ];
    for (const ref of drags) {
      for (const dx of [-3, -0.7, 0.7, 3]) {
        const path = clampPathX(movePathPoint(buildWavePath(1, 0.8), ref, { x: dx, y: 0.2 }));
        expect(isMonotoneX(path)).toBe(true);
      }
    }
  });

  it('khong dung toi tung do', () => {
    const before = buildWavePath(0.5, 0.8);
    const after = clampPathX(before);
    before.anchors.forEach((anchor, i) => {
      expect(after.anchors[i].y).toBe(anchor.y);
      expect(after.anchors[i].in?.y).toBe(anchor.in?.y);
      expect(after.anchors[i].out?.y).toBe(anchor.out?.y);
    });
  });
});
