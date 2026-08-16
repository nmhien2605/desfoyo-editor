import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { buildPathSampler, buildWavePath, warpShapes } from '../warp';
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

describe('warpShapes', () => {
  const shapes: GlyphShape[] = [
    {
      outer: [0, 40, 100, 40, 100, 60, 0, 60],
      holes: [[10, 45, 20, 45, 20, 55]],
      anchorX: 50,
      baselineY: 50,
    },
  ];
  const box = { width: 400, baselineY: 50 };

  it('path phang cho phep dong nhat', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    result[0].outer.forEach((value, i) => expect(value).toBeCloseTo(shapes[0].outer[i], 4));
    result[0].holes[0].forEach((value, i) => expect(value).toBeCloseTo(shapes[0].holes[0][i], 4));
  });

  it('giu nguyen so shape va so lo', () => {
    const sampler = buildPathSampler(buildWavePath(0.6, 0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    expect(result).toHaveLength(1);
    expect(result[0].holes).toHaveLength(1);
    expect(result[0].outer).toHaveLength(shapes[0].outer.length);
  });

  it('path cong lam toa do doi va van huu han', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    expect(result[0].outer.every(Number.isFinite)).toBe(true);
    expect(result[0].outer).not.toEqual(shapes[0].outer);
  });

  it('sampler suy bien tra ve shape goc, khong chia cho 0', () => {
    const sampler = { length: 0, at: () => ({ point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } }) };
    expect(warpShapes(shapes, sampler, box)).toBe(shapes);
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
