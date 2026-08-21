import { describe, expect, it } from 'vitest';
import { buildShadowLayers } from '../textShadow';
import { signedArea, type Contour, type GlyphShape } from '../glyphOutlines';
import type { Effect } from '../../schema';

// Hinh vuong 10x10, 4 canh, moi canh la 1 cubic suy bien (control points chia
// deu tren duong thang) — dung dinh dang 2+6n (n=4 doan => 26 so).
const square: GlyphShape = {
  outer: [
    0, 0, 10 / 3, 0, 20 / 3, 0, 10, 0,
    10, 10 / 3, 10, 20 / 3, 10, 10,
    20 / 3, 10, 10 / 3, 10, 0, 10,
    0, 20 / 3, 0, 10 / 3, 0, 0,
  ],
  holes: [],
};

const base: Extract<Effect, { type: 'text-shadow' }> = {
  type: 'text-shadow',
  style: 'block',
  color: '#000000',
  angle: 0, // +x
  distance: 0.1,
};
const fontSize = 100; // => distance*fontSize = 10px

describe('buildShadowLayers', () => {
  it('drop khong sinh lop hinh hoc nao — do la filter, khong phai geometry', () => {
    expect(buildShadowLayers([square], { ...base, style: 'drop' }, fontSize)).toEqual([]);
  });

  it('block: dung 1 lop, fill, dich dung (dx,dy) theo angle*distance*fontSize', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'block' }, fontSize);
    expect(layers).toHaveLength(1);
    expect(layers[0].mode).toBe('fill');
    const outer = layers[0].shapes[0].outer;
    for (let i = 0; i < outer.length; i += 2) {
      expect(outer[i]).toBeCloseTo(square.outer[i] + 10, 6); // angle=0 => dx=10, dy=0
      expect(outer[i + 1]).toBeCloseTo(square.outer[i + 1], 6);
    }
  });

  it('line: dung 1 lop, stroke, cung cong thuc dich chuyen nhu block', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'line' }, fontSize);
    expect(layers).toHaveLength(1);
    expect(layers[0].mode).toBe('stroke');
  });

  it('block/line giu nguyen holes (dich chuyen ca hole)', () => {
    const withHole: GlyphShape = { outer: square.outer, holes: [square.outer] };
    const layers = buildShadowLayers([withHole], { ...base, style: 'block' }, fontSize);
    expect(layers[0].shapes[0].holes).toHaveLength(1);
    expect(layers[0].shapes[0].holes[0][0]).toBeCloseTo(10, 6);
  });

  it('angle = PI/2 (huong xuong): dy duong, dx ~0', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'block', angle: Math.PI / 2 }, fontSize);
    expect(layers[0].shapes[0].outer[0]).toBeCloseTo(0, 6);
    expect(layers[0].shapes[0].outer[1]).toBeCloseTo(10, 6);
  });

  describe('3d (ribbon)', () => {
    it('tra dung 2 layer fill, day (far cap) truoc, giong het block', () => {
      const layers = buildShadowLayers([square], { ...base, style: '3d' }, fontSize);
      expect(layers).toHaveLength(2);
      expect(layers.every((l) => l.mode === 'fill')).toBe(true);
      const blockLayers = buildShadowLayers([square], { ...base, style: 'block' }, fontSize);
      expect(layers[0].shapes).toEqual(blockLayers[0].shapes);
    });

    it('moi doan cubic sinh dung 1 ribbon, tinh ca outer+holes, khong doan nao song song d', () => {
      const withHole: GlyphShape = { outer: square.outer, holes: [square.outer] };
      const layers = buildShadowLayers([withHole], { ...base, style: '3d', angle: Math.PI / 4 }, fontSize);
      expect(layers[1].shapes).toHaveLength(8); // 4 outer + 4 hole
      for (const shape of layers[1].shapes) {
        expect(shape.holes).toHaveLength(0);
        expect(shape.outer).toHaveLength(26);
      }
    });

    it('toa do ribbon chinh xac cho 1 doan cu the (angle=PI/2, d=(0,10))', () => {
      const layers = buildShadowLayers([square], { ...base, style: '3d', angle: Math.PI / 2 }, fontSize);
      // Doan dau cua square.outer: P0=(0,0) C1=(10/3,0) C2=(20/3,0) P3=(10,0).
      // d=(0,10) => cross = (10-0)*10 - (0-0)*0 = 100 > 0 => chieu xuoi.
      const ribbon = layers[1].shapes.find((s) => Math.abs(s.outer[0]) < 1e-6 && Math.abs(s.outer[1]) < 1e-6);
      expect(ribbon).toBeDefined();
      expect(ribbon!.outer).toHaveLength(26);
      const expected = [
        0, 0, 10 / 3, 0, 20 / 3, 0, 10, 0,
        10, 0, 10, 10, 10, 10,
        20 / 3, 10, 10 / 3, 10, 0, 10,
        0, 10, 0, 0, 0, 0,
      ];
      ribbon!.outer.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
    });

    it('doan song song d khong sinh ribbon', () => {
      // angle=0 => d=(10,0): 2 canh ngang (tren/duoi) song song d, chi 2 canh doc con lai.
      const layers = buildShadowLayers([square], { ...base, style: '3d', angle: 0 }, fontSize);
      expect(layers[1].shapes).toHaveLength(2);
    });

    it('moi ribbon cung chieu (dien tich cung dau) — chot dung bug SVG nonzero winding', () => {
      const N = 4; // 4 cung phan tu — moi cung quet du 90 độ tiep tuyen, chac chan cat huong d
      // Vong tron xap xi bang N cung cubic, quet CCW (dien tich duong).
      const ring = (r: number): Contour => {
        const c: Contour = [];
        for (let i = 0; i < N; i++) {
          const a0 = (i / N) * 2 * Math.PI;
          const a1 = ((i + 1) / N) * 2 * Math.PI;
          const k = (4 / 3) * Math.tan((a1 - a0) / 4);
          const p0 = [r * Math.cos(a0), r * Math.sin(a0)];
          const p3 = [r * Math.cos(a1), r * Math.sin(a1)];
          const c1 = [p0[0] - k * r * Math.sin(a0), p0[1] + k * r * Math.cos(a0)];
          const c2 = [p3[0] + k * r * Math.sin(a1), p3[1] - k * r * Math.cos(a1)];
          if (i === 0) c.push(p0[0], p0[1]);
          c.push(c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]);
        }
        return c;
      };
      // Dao chieu 1 contour dong (dao thu tu doan + hoan doi C1/C2) — dung de
      // tao hole co dien tich nguoc dau voi outer, khong phu thuoc cach ring()
      // sinh diem.
      const reverseContour = (contour: Contour): Contour => {
        const n = (contour.length - 2) / 6;
        const pts: Array<[number, number]> = [[contour[0], contour[1]]];
        for (let s = 0; s < n; s++) {
          const i = 2 + s * 6;
          pts.push([contour[i], contour[i + 1]], [contour[i + 2], contour[i + 3]], [contour[i + 4], contour[i + 5]]);
        }
        const out: Contour = [];
        const last = pts[pts.length - 1];
        out.push(last[0], last[1]);
        for (let s = n; s >= 1; s--) {
          const base = 1 + (s - 1) * 3;
          const [c1x, c1y] = pts[base];
          const [c2x, c2y] = pts[base + 1];
          const [px, py] = pts[base - 1];
          out.push(c2x, c2y, c1x, c1y, px, py);
        }
        return out;
      };
      const donut: GlyphShape = { outer: ring(10), holes: [reverseContour(ring(8))] };
      const layers = buildShadowLayers([donut], { ...base, style: '3d', angle: Math.PI / 4 }, fontSize);
      expect(layers[1].shapes.every((s) => signedArea(s.outer) > 0)).toBe(true);
      expect(layers[1].shapes.length).toBeGreaterThan(N * 2); // xac nhan co tach doan (moi cung phan tu chua tiep tuyen ~d)
    });

    it('distance 0 => khong layer nao', () => {
      expect(buildShadowLayers([square], { ...base, style: '3d', distance: 0 }, fontSize)).toEqual([]);
    });

    it('phu kin: winding number khac 0 tren toan bo thanh mong (regression cho bug "phan lop")', () => {
      // Thanh mong 2x20 (canh 2 theo x, canh 20 theo y), 4 canh cubic suy bien.
      const bar: Contour = [
        0, 0, 2 / 3, 0, 4 / 3, 0, 2, 0,
        2, 20 / 3, 2, 40 / 3, 2, 20,
        4 / 3, 20, 2 / 3, 20, 0, 20,
        0, 40 / 3, 0, 20 / 3, 0, 0,
      ];
      const shape: GlyphShape = { outer: bar, holes: [] };
      const layers = buildShadowLayers([shape], { ...base, style: '3d', angle: 0, distance: 0.1 }, fontSize);

      const flatten = (contour: Contour, samplesPerSeg: number): Array<[number, number]> => {
        const pts: Array<[number, number]> = [];
        const n = (contour.length - 2) / 6;
        for (let s = 0; s < n; s++) {
          const i = s * 6;
          const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = [
            contour[i], contour[i + 1], contour[i + 2], contour[i + 3], contour[i + 4], contour[i + 5], contour[i + 6], contour[i + 7],
          ];
          for (let k = 0; k < samplesPerSeg; k++) {
            const t = k / samplesPerSeg;
            const u = 1 - t;
            const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1;
            const y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1;
            pts.push([x, y]);
          }
        }
        return pts;
      };

      const windingAt = (px: number, py: number): number => {
        let w = 0;
        for (const s of layers[1].shapes) {
          const pts = flatten(s.outer, 64);
          for (let i = 0; i < pts.length; i++) {
            const [x0, y0] = pts[i];
            const [x1, y1] = pts[(i + 1) % pts.length];
            if (y0 <= py) {
              if (y1 > py && (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) > 0) w++;
            } else if (y1 <= py && (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) < 0) w--;
          }
        }
        return w;
      };

      for (const [px, py] of [
        [1, 10],
        [5, 10],
        [9, 10],
        [11, 10],
      ]) {
        expect(windingAt(px, py)).not.toBe(0);
      }
    });
  });
});
