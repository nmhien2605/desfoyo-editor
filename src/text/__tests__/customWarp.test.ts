import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import type { GlyphShape } from '../glyphOutlines';
import { warpContoursOnPath } from '../customWarp';
import { buildPathFrame, buildWavePath, clampPathX } from '../warp';

const SIZE = { width: 400, height: 100 };
const FONT_SIZE = 70;
const BASELINE_Y = 50;
const CENTER_Y = 40;

function shape(points: number[]): GlyphShape {
  return { outer: points, holes: [] };
}

function lineSeg(out: number[], x0: number, y0: number, x1: number, y1: number): void {
  out.push(
    x0 + (x1 - x0) / 3,
    y0 + (y1 - y0) / 3,
    x0 + (2 * (x1 - x0)) / 3,
    y0 + (2 * (y1 - y0)) / 3,
    x1,
    y1,
  );
}

function rect(x0: number, y0: number, x1: number, y1: number): number[] {
  const c = [x0, y0];
  lineSeg(c, x0, y0, x1, y0);
  lineSeg(c, x1, y0, x1, y1);
  lineSeg(c, x1, y1, x0, y1);
  lineSeg(c, x0, y1, x0, y0);
  return c;
}

function points(contour: number[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < contour.length; i += 2) out.push([contour[i], contour[i + 1]]);
  return out;
}

function dist(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

const CURVED_PATH: WarpPath = clampPathX(buildWavePath(1, 0.5, FONT_SIZE, SIZE.height));

describe('warpContoursOnPath', () => {
  it('bat bien rigid: khoang cach giua 2 diem cung shape giu nguyen truoc/sau — khong meo hinh', () => {
    const frame = buildPathFrame(CURVED_PATH, SIZE, BASELINE_Y)!;
    const pivotX = 150;
    const box = shape(rect(pivotX - 20, CENTER_Y - 10, pivotX + 20, CENTER_Y + 10));
    const [out] = warpContoursOnPath([box], [pivotX], CENTER_Y, frame);
    const before = points(box.outer);
    const after = points(out.outer);
    for (let i = 0; i < before.length; i++) {
      for (let j = i + 1; j < before.length; j++) {
        expect(dist(after[i], after[j])).toBeCloseTo(dist(before[i], before[j]), 9);
      }
    }
  });

  it('pivot (pivotX, centerY) duoc dat dung tai (frame.X(s), frame.Y(s))', () => {
    const frame = buildPathFrame(CURVED_PATH, SIZE, BASELINE_Y)!;
    const pivotX = 120;
    const box = shape(rect(pivotX - 20, CENTER_Y - 10, pivotX + 20, CENTER_Y + 10));
    const [out] = warpContoursOnPath([box], [pivotX], CENTER_Y, frame);
    // Diem (pivotX, CENTER_Y) khong nam tren contour (la tam hinh chu nhat,
    // khong phai dinh) — kiem gian tiep bang tam cua bbox sau transform, vi
    // rigid transform giu tam hinh chu nhat la tam bbox.
    const xs = out.outer.filter((_, i) => i % 2 === 0);
    const ys = out.outer.filter((_, i) => i % 2 === 1);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    expect(cx).toBeCloseTo(frame.X(pivotX), 6);
    expect(cy).toBeCloseTo(frame.Y(pivotX), 6);
  });

  it('glyph co pivotX ngoai [0, L] bi loai nguyen, khong con trong ket qua', () => {
    const frame = buildPathFrame(CURVED_PATH, SIZE, BASELINE_Y)!;
    const inside = shape(rect(100, 0, 140, 20));
    const outside = shape(rect(-50, 0, -10, 20)); // pivotX < 0
    const wayOutside = shape(rect(0, 0, 40, 20)); // pivotX = frame.L + 1000, gan qua L
    const out = warpContoursOnPath(
      [inside, outside, wayOutside],
      [120, -30, frame.L + 1000],
      CENTER_Y,
      frame,
    );
    expect(out).toHaveLength(1);
  });

  it('doan phang: glyph khong xoay (goc 0), dat dung tren duong thang', () => {
    const flat: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 1, y: 0.9 },
      ],
    };
    const frame = buildPathFrame(flat, SIZE, BASELINE_Y)!;
    const pivotX = 50; // nam trong doan phang dau (x < 0.5*400=200)
    const box = shape(rect(pivotX - 10, CENTER_Y - 5, pivotX + 10, CENTER_Y + 5));
    const [out] = warpContoursOnPath([box], [pivotX], CENTER_Y, frame);
    // Khong xoay: hinh chu nhat van la hinh chu nhat truc thang, be rong/cao
    // giu nguyen 20/10.
    const xs = out.outer.filter((_, i) => i % 2 === 0);
    const ys = out.outer.filter((_, i) => i % 2 === 1);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(20, 6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(10, 6);
  });
});
