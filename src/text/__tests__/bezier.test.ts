import { describe, expect, it } from 'vitest';
import { evalCubic, evalD1, extrema, splitCubic } from '../bezier';

describe('extrema', () => {
  it('cung don dieu theo mot truc thi khong co cuc tri trong (0,1)', () => {
    expect(extrema(0, 1, 2, 3)).toEqual([]);
  });

  it('nghiem tra ve dung la cho B1(t) = 0', () => {
    const roots = extrema(0, 4, 1, 3);
    expect(roots).toHaveLength(2);
    for (const t of roots) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
      expect(evalD1(0, 4, 1, 3, t)).toBeCloseTo(0, 9);
    }
  });

  it('nhanh tuyen tinh khi he so bac hai trieu tieu', () => {
    // a = -p0 + 3c1 - 3c2 + p3 = 0 + 3 - 3 + 0 = 0 => B1 la da thuc bac 1.
    expect(extrema(0, 1, 1, 0)).toEqual([0.5]);
  });

  it('cung vuot ra ngoai khoang hai dau mut: cuc tri nam ngoai [p0, p3]', () => {
    // x cua segment nay cham 20 trong khi hai dau mut chi la 0 va 10.
    const roots = extrema(0, 30, 20, 10);
    const xs = roots.map((t) => evalCubic(0, 30, 20, 10, t));
    expect(Math.max(...xs)).toBeGreaterThan(10);
  });
});

describe('splitCubic', () => {
  it('hai nua bieu dien CHINH XAC cung goc', () => {
    const [p0, c1, c2, p3] = [1, 7, -3, 5];
    const { left, right } = splitCubic(p0, c1, c2, p3, 0.3);
    for (let k = 0; k <= 10; k++) {
      const s = k / 10;
      expect(evalCubic(left[0], left[1], left[2], left[3], s)).toBeCloseTo(
        evalCubic(p0, c1, c2, p3, 0.3 * s),
        9,
      );
      expect(evalCubic(right[0], right[1], right[2], right[3], s)).toBeCloseTo(
        evalCubic(p0, c1, c2, p3, 0.3 + 0.7 * s),
        9,
      );
    }
  });

  it('diem noi dung bang nhau o hai nua', () => {
    const { left, right } = splitCubic(1, 7, -3, 5, 0.42);
    expect(left[3]).toBe(right[0]);
  });

  it('giu nguyen hai dau mut goc', () => {
    const { left, right } = splitCubic(1, 7, -3, 5, 0.42);
    expect(left[0]).toBe(1);
    expect(right[3]).toBe(5);
  });
});
