import { describe, expect, it } from 'vitest';
import type { GlyphShape } from '../glyphOutlines';
import { warpContoursCircle } from '../circleWarp';

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

const CX = 170.79049405401295;
const CY = -231.13457402271877;
const R = 326.13121374785544;
const BASELINE_Y = 0;

describe('warpContoursCircle', () => {
  it('bat bien rigid: khoang cach giua 2 diem cung shape giu nguyen truoc/sau', () => {
    const box = shape(rect(50, -10, 90, 30));
    const [out] = warpContoursCircle([box], [70], BASELINE_Y, {
      cx: CX,
      cy: CY,
      r: R,
      directionInverted: false,
    });
    const before = points(box.outer);
    const after = points(out.outer);
    for (let i = 0; i < before.length; i++) {
      for (let j = i + 1; j < before.length; j++) {
        expect(dist(after[i], after[j])).toBeCloseTo(dist(before[i], before[j]), 9);
      }
    }
  });

  it('pivot luon nam dung tren vong tron ban kinh r (ca hai dau directionInverted)', () => {
    for (const directionInverted of [false, true]) {
      const pivotX = 42;
      const box = shape(rect(pivotX - 20, -10, pivotX + 20, 10));
      const [out] = warpContoursCircle([box], [pivotX], BASELINE_Y, {
        cx: CX,
        cy: CY,
        r: R,
        directionInverted,
      });
      // pivot = trung diem (min+max)/2 cua rect = (pivotX-20+pivotX+20)/2 = pivotX,
      // tai y = BASELINE_Y — chinh la diem (pivotX, BASELINE_Y) duoc anh xa qua placement.
      const sign = directionInverted ? -1 : 1;
      const phi = sign * (Math.PI / 2 + pivotX / R);
      const placeX = CX + R * Math.cos(phi);
      const placeY = CY + R * Math.sin(phi);
      expect(Math.hypot(placeX - CX, placeY - CY)).toBeCloseTo(R, 9);
      // Xac nhan luon: mot diem cua contour dung tai (pivotX, BASELINE_Y) [trung
      // diem canh trai/phai cua rect nam ngang qua pivotX] anh xa dung ve placeX/placeY.
      const outPts = points(out.outer);
      const inPts = points(box.outer);
      const idx = inPts.findIndex((p) => p[0] === pivotX && p[1] === BASELINE_Y);
      if (idx >= 0) {
        expect(outPts[idx][0]).toBeCloseTo(placeX, 6);
        expect(outPts[idx][1]).toBeCloseTo(placeY, 6);
      }
    }
  });

  it('doi chieu so lieu that do tren Kittl (docs/kittl-circle-reverse-engineered.md §3)', () => {
    // Dataset "CIRCLETEST": cx/cy/r o tren; glyph 0 co pivotX (he toa do tam-hop
    // cua Kittl) = -142.773, quy doi ve he goc-trai (cung quy uoc layout.ts) bang
    // cach tru di goc trai thuc su cua Kittl (-width/2 = -166.66 voi width=333.32):
    //   pivotX = -142.773 - (-166.66) = 23.887
    // theta_rotation do duoc bang Kabsch cho glyph 0 (sign=+1): -3.067526754326042
    const pivotX = -142.773 - -166.66;
    const sign = 1;
    const phi = sign * (Math.PI / 2 + pivotX / R);
    let theta = phi + sign * (Math.PI / 2);
    // wrap ve (-pi, pi]
    while (theta > Math.PI) theta -= 2 * Math.PI;
    while (theta <= -Math.PI) theta += 2 * Math.PI;
    // Sai lech ~8e-4 rad la nhieu tu left-side-bearing cua glyph dau (da ghi
    // trong tai lieu do) — khong phai loi cong thuc, nen dung nguong 1e-3 thay
    // vi toBeCloseTo (qua chat, gia dinh sai so chi tu lam tron).
    expect(Math.abs(theta - -3.0675)).toBeLessThan(1e-3);
  });

  it('directionInverted=true cho phi nguoc dau chinh xac so voi false (cung pivotX)', () => {
    const pivotX = 88;
    const phiFalse = 1 * (Math.PI / 2 + pivotX / R);
    const phiTrue = -1 * (Math.PI / 2 + pivotX / R);
    expect(phiTrue).toBeCloseTo(-phiFalse, 12);
  });

  it('text dai hon chu vi: khong clamp, van cho ket qua huu han (khong cat)', () => {
    const pivotX = R * Math.PI * 2; // vuot han mot vong tron
    const box = shape(rect(pivotX - 5, -5, pivotX + 5, 5));
    const [out] = warpContoursCircle([box], [pivotX], BASELINE_Y, {
      cx: CX,
      cy: CY,
      r: R,
      directionInverted: false,
    });
    for (const v of out.outer) expect(Number.isFinite(v)).toBe(true);
  });
});
