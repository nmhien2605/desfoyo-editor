import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import {
  buildWarpMap,
  buildWavePath,
  clampPathX,
  curveHeightOf,
  warpContours,
  type WarpMap,
} from '../warp';
import { evalCubic } from '../bezier';
import type { GlyphShape } from '../glyphOutlines';

const SIZE = { width: 400, height: 100 };
const FONT_SIZE = 70;

describe('buildWavePath', () => {
  it('dung 3 anchor va 4 handle', () => {
    const path = buildWavePath(0.5, 0.8, FONT_SIZE, SIZE.height);
    expect(path.anchors).toHaveLength(3);
    const handles = path.anchors.flatMap((a) => [a.in, a.out]).filter(Boolean);
    expect(handles).toHaveLength(4);
  });

  it('anchor dau chi co out, anchor cuoi chi co in, anchor giua co ca hai', () => {
    const [first, middle, last] = buildWavePath(0.5, 0.8, FONT_SIZE, SIZE.height).anchors;
    expect(first.in).toBeUndefined();
    expect(first.out).toBeDefined();
    expect(middle.in).toBeDefined();
    expect(middle.out).toBeDefined();
    expect(last.in).toBeDefined();
    expect(last.out).toBeUndefined();
  });

  it('curveHeight = 0 cho duong nam ngang tuyet doi', () => {
    const path = buildWavePath(0, 0.8, FONT_SIZE, SIZE.height);
    const ys = path.anchors.flatMap((a) =>
      [a.y, a.in?.y, a.out?.y].filter((v): v is number => v !== undefined),
    );
    expect(ys.every((y) => Math.abs(y - 0.8) < 1e-9)).toBe(true);
  });

  it('anchor giua nam giua theo truc x, anchor dau va cuoi o hai mep', () => {
    const path = buildWavePath(0.5, 0.8, FONT_SIZE, SIZE.height);
    expect(path.anchors.map((a) => a.x)).toEqual([0, 0.5, 1]);
  });

  it('handle vao anchor cuoi nam cao hon anchor cuoi, tao cung vong len', () => {
    const path = buildWavePath(0.5, 0.8, FONT_SIZE, SIZE.height);
    const last = path.anchors[2];
    // y nhỏ hơn = cao hơn trên màn hình
    expect(last.in!.y).toBeLessThan(last.y);
  });

  it('khoang dao dong doc dung bang |curveHeight| * fontSize', () => {
    for (const curve of [0.5, 1, 2.5, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      const ys: number[] = [];
      for (const anchor of path.anchors) {
        ys.push(anchor.y);
        if (anchor.in) ys.push(anchor.in.y);
        if (anchor.out) ys.push(anchor.out.y);
      }
      const spreadPx = (Math.max(...ys) - Math.min(...ys)) * SIZE.height;
      expect(spreadPx).toBeCloseTo(curve * FONT_SIZE, 9);
    }
  });

  it('curveHeight am lat nguoc duong cong quanh baseline', () => {
    const up = buildWavePath(1, 0.5, FONT_SIZE, SIZE.height);
    const down = buildWavePath(-1, 0.5, FONT_SIZE, SIZE.height);
    up.anchors.forEach((anchor, i) => {
      expect(down.anchors[i].y - 0.5).toBeCloseTo(-(anchor.y - 0.5), 12);
    });
  });
});

function shape(points: number[]): GlyphShape {
  return { outer: points, holes: [] };
}

// Dung mot doan thang bang cubic voi control point chia deu — dung cach
// commandsToContours dang lam, nen contour test giong contour that.
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

// Tham chieu doc lap: di doc polybezier bang buoc rat nho, cong don do dai
// day cung. Cham nhung khong dung chung mot dong code nao voi buildWarpMap,
// nen no bat duoc loi cua bang tra chu khong lap lai loi do.
function walkPath(path: WarpPath, size: { width: number; height: number }) {
  const pts: { x: number; y: number; u: number }[] = [];
  const px = (p: { x: number; y: number }) => ({ x: p.x * size.width, y: p.y * size.height });
  let u = 0;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = px(from);
    const p3 = px(to);
    const c1 = from.out ? px(from.out) : p0;
    const c2 = to.in ? px(to.in) : p3;
    const steps = 40000;
    for (let s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / steps;
      const p = {
        x: evalCubic(p0.x, c1.x, c2.x, p3.x, t),
        y: evalCubic(p0.y, c1.y, c2.y, p3.y, t),
      };
      if (prev) u += Math.hypot(p.x - prev.x, p.y - prev.y);
      pts.push({ ...p, u });
      prev = p;
    }
  }
  const total = u;
  const at = (s: number) => {
    const target = Math.min(Math.max(s, 0), total);
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].u <= target) lo = mid;
      else hi = mid;
    }
    return pts[lo];
  };
  return { total, at };
}

describe('buildWarpMap', () => {
  const WAVE = () => clampPathX(buildWavePath(1, 0.5, FONT_SIZE, SIZE.height));

  it('path phang dung tai baseline tra null — khong warp gi ca', () => {
    expect(buildWarpMap(buildWavePath(0, 0.5, FONT_SIZE, SIZE.height), SIZE, 50)).toBeNull();
  });

  it('path duoi 2 anchor tra null', () => {
    const single: WarpPath = { role: 'baseline', closed: false, anchors: [{ x: 0, y: 0.9 }] };
    expect(buildWarpMap(single, SIZE, 50)).toBeNull();
  });

  it('X ghim dung hai mep hop: X(0) = 0 va X(W) = W', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(0)).toBe(0);
    expect(Math.abs(map.X(SIZE.width) - SIZE.width)).toBeLessThan(0.1);
  });

  it('X khong giam tren [0, W]', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    let prev = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const v = map.X((SIZE.width * i) / 1000);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('L >= W va k = L / W', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.L).toBeGreaterThan(SIZE.width);
    expect(map.k).toBeCloseTo(map.L / SIZE.width, 12);
  });

  it('L khop tham chieu doc lap duoi 0.05px', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    expect(Math.abs(map.L - walkPath(path, SIZE).total)).toBeLessThan(0.05);
  });

  it('X va D khop tham chieu doc lap duoi 0.05px tren toan hop', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    const ref = walkPath(path, SIZE);
    const y0 = ref.at(0).y;
    for (let x = 0; x <= SIZE.width; x += 2) {
      const p = ref.at(map.k * x);
      expect(Math.abs(map.X(x) - p.x)).toBeLessThan(0.05);
      expect(Math.abs(map.D(x) - (p.y - y0))).toBeLessThan(0.05);
    }
  });

  it('X va D khop tham chieu doc lap duoi 0.05px o curveHeight = 4 (bien do lon nhat slider)', () => {
    // MAX_DEPTH duoc do lai o Task 3 dua tren tieu chi affine hai truc cua
    // warpSegment (WARP_TOL), khac tieu chi flatness cua samplePath (LUT_TOL)
    // dung de dung bang tra cua chinh buildWarpMap. Test nay khoa rieng do
    // chinh xac cua LUT o bien do doc nhat, de MAX_DEPTH giam trong tuong lai
    // se bi bat neu no lam LUT hoi tu kem.
    const path = clampPathX(buildWavePath(4, 0.5, FONT_SIZE, SIZE.height));
    const map = buildWarpMap(path, SIZE, 50)!;
    const ref = walkPath(path, SIZE);
    const y0 = ref.at(0).y;
    for (let x = 0; x <= SIZE.width; x += 2) {
      const p = ref.at(map.k * x);
      expect(Math.abs(map.X(x) - p.x)).toBeLessThan(0.05);
      expect(Math.abs(map.D(x) - (p.y - y0))).toBeLessThan(0.05);
    }
  });

  it('kep ve dau mut khi x ra ngoai [0, W]', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(-100)).toBe(map.X(0));
    expect(map.D(-100)).toBe(map.D(0));
    expect(map.X(900)).toBe(map.X(SIZE.width));
    expect(map.D(900)).toBe(map.D(SIZE.width));
  });

  it('D neo o diem DAU path, khong phai baseline: tinh tien path doc khong doi ket qua', () => {
    // P_y va y0 cung dich mot luong => D khong doi. Day la ly do vi tri doc
    // tuyet doi cua path khong anh huong hinh, chi hinh dang moi anh huong.
    const base = WAVE();
    const shifted: WarpPath = {
      ...base,
      anchors: base.anchors.map((a) => ({
        ...a,
        y: a.y + 0.1,
        in: a.in ? { ...a.in, y: a.in.y + 0.1 } : undefined,
        out: a.out ? { ...a.out, y: a.out.y + 0.1 } : undefined,
      })),
    };
    const m1 = buildWarpMap(base, SIZE, 50)!;
    const m2 = buildWarpMap(shifted, SIZE, 50)!;
    for (let x = 0; x <= SIZE.width; x += 20) {
      expect(m2.D(x)).toBeCloseTo(m1.D(x), 9);
      expect(m2.X(x)).toBeCloseTo(m1.X(x), 9);
    }
  });
});

// Map giai tich, khong qua bang tra: test nay do RIENG phan chia nho + ap
// affine, khong keo theo sai so cua buildWarpMap.
// He so 8/30 < 1 nen X don dieu tang; 0 <= X' <= 1.27.
const analytic: WarpMap = {
  L: 0,
  k: 1,
  X: (x) => x + 8 * Math.sin(x / 30),
  D: (x) => 12 * Math.sin(x / 25),
};

// Nghich dao cua analytic.X bang chia doi — X don dieu nen chia doi hoi tu.
function inverseX(target: number): number {
  let lo = -200;
  let hi = 400;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (analytic.X(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

describe('warpContours', () => {
  it('I4 — khong xoay: hai diem cung x cho cung x moi, hieu y giu nguyen', () => {
    // Canh phai cua hop: x = 60 co dinh, y chay tu 20 xuong 80.
    const box = rect(10, 20, 60, 80);
    const out = warpContours([shape(box)], analytic)[0].outer;
    const xRight = analytic.X(60);
    const onRightEdge: number[] = [];
    for (let i = 0; i < out.length; i += 2) {
      if (Math.abs(out[i] - xRight) < 1e-9) onRightEdge.push(out[i + 1]);
    }
    expect(onRightEdge.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...onRightEdge) - Math.min(...onRightEdge)).toBeCloseTo(60, 9);
  });

  it('I5 — dinh dang 2 + 6n va contour kin TUYET DOI', () => {
    const out = warpContours([shape(rect(10, 20, 60, 80))], analytic)[0].outer;
    expect((out.length - 2) % 6).toBe(0);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('I5 — segment co cuc tri hoanh do van khop chinh xac o moi noi', () => {
    // Segment cuoi vong sang phai toi x ~ 15 roi quay ve x = 0, tuc p0.x = 10
    // nam han trong (xa, xb). Day cung tren [xa, xb] se lam diem dong lech
    // khoi diem mo; noi suy dau mut thi khong.
    const c = [0, 0];
    lineSeg(c, 0, 0, 10, 0);
    lineSeg(c, 10, 0, 10, 20);
    c.push(30, 25, -15, 5, 0, 0);
    const out = warpContours([shape(c)], analytic)[0].outer;
    expect(out[0]).toBeCloseTo(analytic.X(0), 12);
    expect(out[1]).toBeCloseTo(analytic.D(0), 12);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('I6 — sai so hinh bi chan boi WARP_TOL tren ca hai truc', () => {
    // Nghich dao tung diem dau ra: x goc = X^-1(x'), y goc = y' - D(x goc).
    // Diem goc phai roi ve dung mot canh ngang cua hop (y = 20 hoac y = 80).
    //
    // Nguong 0.12 chu khong phai 0.05: hai sai so cong lai. Lech X toi WARP_TOL
    // lam X^-1 lech 0.05/min(X') = 0.068, nhan do doc cua D (12/25) ra them
    // 0.033; cong lech cua chinh D (0.05) la ~0.15 truong hop xau nhat. Lay
    // 0.12 vi hai sai so hiem khi cung dau va cung cuc dai.
    const out = warpContours([shape(rect(10, 20, 60, 80))], analytic)[0].outer;
    for (let i = 0; i + 7 < out.length; i += 6) {
      // Canh doc: x goc hang nen anh cung hang, khong nam tren canh ngang nao.
      if (Math.abs(out[i + 6] - out[i]) < 1e-9) continue;
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const x = evalCubic(out[i], out[i + 2], out[i + 4], out[i + 6], t);
        const y = evalCubic(out[i + 1], out[i + 3], out[i + 5], out[i + 7], t);
        const ySrc = y - analytic.D(inverseX(x));
        expect(Math.min(Math.abs(ySrc - 20), Math.abs(ySrc - 80))).toBeLessThan(0.12);
      }
    }
  });

  it('chia nho lam tang so segment', () => {
    const box = rect(10, 20, 60, 80);
    const out = warpContours([shape(box)], analytic)[0].outer;
    expect(out.length).toBeGreaterThan(box.length);
  });

  it('ap ca cho holes', () => {
    const outer = rect(0, 0, 100, 100);
    const hole = rect(30, 30, 70, 70);
    const [out] = warpContours([{ outer, holes: [hole] }], analytic);
    expect(out.holes).toHaveLength(1);
    expect(out.holes[0]).not.toEqual(hole);
    expect(out.holes[0][0]).toBeCloseTo(analytic.X(30), 12);
  });

  it('map dong nhat cho lai dung contour goc', () => {
    const identity: WarpMap = { L: 0, k: 1, X: (x) => x, D: () => 0 };
    const box = rect(10, 20, 60, 80);
    expect(warpContours([shape(box)], identity)[0].outer).toEqual(box);
  });
});

describe('curveHeightOf', () => {
  it('doc nguoc dung con so da dung de sinh path', () => {
    for (const curve of [0.25, 1, 2.5, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      expect(curveHeightOf(path, SIZE.height, FONT_SIZE)).toBeCloseTo(curve, 9);
    }
  });

  it('path phang cho 0', () => {
    const flat = buildWavePath(0, 0.5, FONT_SIZE, SIZE.height);
    expect(curveHeightOf(flat, SIZE.height, FONT_SIZE)).toBe(0);
  });

  it('lay dau theo chieu: diem dau cao hon diem cuoi la duong', () => {
    const up = buildWavePath(1, 0.5, FONT_SIZE, SIZE.height);
    const down = buildWavePath(-1, 0.5, FONT_SIZE, SIZE.height);
    expect(curveHeightOf(up, SIZE.height, FONT_SIZE)).toBeGreaterThan(0);
    expect(curveHeightOf(down, SIZE.height, FONT_SIZE)).toBeLessThan(0);
  });

  it('kep ve khoang slider [-1, 4]', () => {
    const huge = buildWavePath(4, 0.5, FONT_SIZE, SIZE.height);
    const scaled: WarpPath = {
      ...huge,
      anchors: huge.anchors.map((a) => ({
        ...a,
        y: 0.5 + (a.y - 0.5) * 10,
        in: a.in ? { ...a.in, y: 0.5 + (a.in.y - 0.5) * 10 } : undefined,
        out: a.out ? { ...a.out, y: 0.5 + (a.out.y - 0.5) * 10 } : undefined,
      })),
    };
    expect(curveHeightOf(scaled, SIZE.height, FONT_SIZE)).toBe(4);
  });
});
