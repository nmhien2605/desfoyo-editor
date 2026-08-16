import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import {
  arcLength,
  bakeScale,
  buildPathSampler,
  buildWavePath,
  placeOnPath,
  solveHorizontalScale,
} from '../warp';
import type { GlyphShape } from '../glyphOutlines';

const SIZE = { width: 400, height: 100 };

function flatPath(y: number): WarpPath {
  return {
    role: 'baseline',
    closed: false,
    anchors: [
      { x: 0, y, out: { x: 0.33, y } },
      { x: 1, y, in: { x: 0.66, y } },
    ],
  };
}

describe('buildPathSampler', () => {
  it('do dai cua path thang bang khoang cach hai dau mut', () => {
    expect(buildPathSampler(flatPath(0.5), SIZE).length).toBeCloseTo(400, 4);
  });

  it('lay mau dung diem va tiep tuyen tren path thang', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const { point, tangent } = sampler.at(200);
    expect(point.x).toBeCloseTo(200, 4);
    expect(point.y).toBeCloseTo(50, 4);
    expect(tangent.x).toBeCloseTo(1, 4);
    expect(tangent.y).toBeCloseTo(0, 4);
  });

  it('path suy bien (moi anchor trung nhau) co length = 0', () => {
    const degenerate: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ],
    };
    expect(buildPathSampler(degenerate, SIZE).length).toBeCloseTo(0, 6);
  });
});

describe('buildWavePath', () => {
  it('dung 3 anchor va 4 handle', () => {
    const path = buildWavePath(0.5, 0.8);
    expect(path.anchors).toHaveLength(3);
    const handles = path.anchors.flatMap((a) => [a.in, a.out]).filter(Boolean);
    expect(handles).toHaveLength(4);
  });

  it('anchor dau chi co out, anchor cuoi chi co in, anchor giua co ca hai', () => {
    const [first, middle, last] = buildWavePath(0.5, 0.8).anchors;
    expect(first.in).toBeUndefined();
    expect(first.out).toBeDefined();
    expect(middle.in).toBeDefined();
    expect(middle.out).toBeDefined();
    expect(last.in).toBeDefined();
    expect(last.out).toBeUndefined();
  });

  it('intensity = 0 cho duong nam ngang tuyet doi', () => {
    const path = buildWavePath(0, 0.8);
    const ys = path.anchors.flatMap((a) =>
      [a.y, a.in?.y, a.out?.y].filter((v): v is number => v !== undefined),
    );
    expect(ys.every((y) => Math.abs(y - 0.8) < 1e-9)).toBe(true);
  });

  it('anchor giua nam giua theo truc x, anchor dau va cuoi o hai mep', () => {
    const path = buildWavePath(0.5, 0.8);
    expect(path.anchors.map((a) => a.x)).toEqual([0, 0.5, 1]);
  });

  it('handle vao anchor cuoi nam cao hon anchor cuoi, tao cung vong len', () => {
    const path = buildWavePath(0.5, 0.8);
    const last = path.anchors[2];
    // y nhỏ hơn = cao hơn trên màn hình
    expect(last.in!.y).toBeLessThan(last.y);
  });
});

function shape(points: number[], anchorX: number, baselineY: number): GlyphShape {
  return { outer: points, holes: [], anchorX, baselineY };
}

describe('placeOnPath', () => {
  it('path phang tai baseline la phep dong nhat', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const input = [shape([10, 40, 30, 60], 20, 50)];
    const [out] = placeOnPath(input, sampler, 50);
    expect(out.outer[0]).toBeCloseTo(10, 6);
    expect(out.outer[1]).toBeCloseTo(40, 6);
    expect(out.outer[2]).toBeCloseTo(30, 6);
    expect(out.outer[3]).toBeCloseTo(60, 6);
  });

  it('bao toan khoang cach trong cung glyph tren path cong', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const input = [shape([10, 20, 30, 80], 20, 50)];
    const before = Math.hypot(10 - 30, 20 - 80);
    const [out] = placeOnPath(input, sampler, 50);
    const after = Math.hypot(out.outer[0] - out.outer[2], out.outer[1] - out.outer[3]);
    expect(after).toBeCloseTo(before, 6);
  });

  it('dong thu hai nam dung offset theo phap tuyen', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const lineStep = 120;
    const [a, b] = placeOnPath(
      [shape([20, 50], 20, 50), shape([20, 50 + lineStep], 20, 50 + lineStep)],
      sampler,
      50,
    );
    const { point, tangent } = sampler.at(20);
    expect(a.outer[0]).toBeCloseTo(point.x, 6);
    expect(a.outer[1]).toBeCloseTo(point.y, 6);
    expect(b.outer[0]).toBeCloseTo(point.x - tangent.y * lineStep, 6);
    expect(b.outer[1]).toBeCloseTo(point.y + tangent.x * lineStep, 6);
  });

  it('bo glyph co anchorX vuot qua cuoi path', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE); // length = 400
    const out = placeOnPath([shape([0, 50], 100, 50), shape([0, 50], 500, 50)], sampler, 50);
    expect(out).toHaveLength(1);
    expect(out[0].anchorX).toBe(100);
  });

  it('giu nguyen khoang cach ARC-LENGTH giua hai glyph lien tiep', () => {
    // Neo dat theo advance that: s = anchorX. Khoang cach doc cung giua hai
    // neo phai bang hieu anchorX, khong bi keo gian theo do cong cua path.
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const [a, b] = placeOnPath([shape([120, 50], 120, 50), shape([200, 50], 200, 50)], sampler, 50);
    expect(a.outer[0]).toBeCloseTo(sampler.at(120).point.x, 6);
    expect(a.outer[1]).toBeCloseTo(sampler.at(120).point.y, 6);
    expect(b.outer[0]).toBeCloseTo(sampler.at(200).point.x, 6);
    expect(b.outer[1]).toBeCloseTo(sampler.at(200).point.y, 6);
  });
});

describe('bakeScale', () => {
  it('co quanh tam ngang, giu nguyen y', () => {
    const baked = bakeScale(flatPath(0.5), 0.5);
    expect(baked.anchors[0].x).toBeCloseTo(0.25, 9);
    expect(baked.anchors[1].x).toBeCloseTo(0.75, 9);
    expect(baked.anchors[0].y).toBeCloseTo(0.5, 9);
    expect(baked.anchors[0].out?.x).toBeCloseTo(0.415, 9);
  });

  it('k = 1 la phep dong nhat', () => {
    expect(bakeScale(buildWavePath(1, 0.8), 1)).toEqual(buildWavePath(1, 0.8));
  });
});

describe('solveHorizontalScale', () => {
  it('path phang da vua chu => k = 1', () => {
    expect(solveHorizontalScale(flatPath(0.5), SIZE, SIZE.width)).toBe(1);
  });

  it('path cong => k < 1 va arc length khop be rong chu', () => {
    const path = buildWavePath(1, 0.8);
    const k = solveHorizontalScale(path, SIZE, SIZE.width);
    expect(k).toBeLessThan(1);
    expect(k).toBeGreaterThan(0.05);
    expect(arcLength(bakeScale(path, k), SIZE)).toBeCloseTo(SIZE.width, 1);
  });

  it('bien do qua lon so voi be rong => tra ve san MIN_SCALE', () => {
    // target rat nho: du co ngang het co, path van dai hon.
    const k = solveHorizontalScale(buildWavePath(1, 0.8), SIZE, 1);
    expect(k).toBeCloseTo(0.05, 9);
  });
});

// Tich phan do dai cung bang cach chia rat min — ban cai dat doc lap de doi
// chieu, khong dung lai code cua sampler.
function referenceLength(p: number[][], steps = 40000): number {
  const at = (t: number, i: number) => {
    const u = 1 - t;
    return (
      u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]
    );
  };
  let total = 0;
  for (let k = 1; k <= steps; k++) {
    const t0 = (k - 1) / steps;
    const t1 = k / steps;
    total += Math.hypot(at(t1, 0) - at(t0, 0), at(t1, 1) - at(t0, 1));
  }
  return total;
}

describe('sampler chinh xac', () => {
  it('tangent khong suy bien khi anchor thieu handle', () => {
    // anchor dau khong co `out` => c1 = p0 => B'(0) = 0. Cong thuc cu tra
    // vector khong, lam glyph co ve mot diem khi ap phep bien doi cung.
    const noHandle: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.5 },
        { x: 1, y: 0.5, in: { x: 0.5, y: 0.5 } },
      ],
    };
    const { tangent } = buildPathSampler(noHandle, SIZE).at(0);
    expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 9);
    expect(tangent.x).toBeCloseTo(1, 6);
    expect(tangent.y).toBeCloseTo(0, 6);
  });

  it('do dai khop voi tich phan doc lap tren path cong manh', () => {
    const curved: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.9, out: { x: 0.1, y: 0.0 } },
        { x: 1, y: 0.9, in: { x: 0.9, y: 0.0 } },
      ],
    };
    const expected = referenceLength([
      [0, 90],
      [40, 0],
      [360, 0],
      [400, 90],
    ]);
    expect(buildPathSampler(curved, SIZE).length).toBeCloseTo(expected, 1);
  });

  it('tangent la vector don vi tai moi vi tri tren path cong', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.8), SIZE);
    for (let i = 0; i <= 10; i++) {
      const { tangent } = sampler.at((sampler.length * i) / 10);
      expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 9);
    }
  });
});
