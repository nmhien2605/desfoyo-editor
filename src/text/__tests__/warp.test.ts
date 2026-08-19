import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import {
  buildAnglePath,
  buildArchPath,
  buildFlagPath,
  buildRisePath,
  buildWarpMap,
  buildWavePath,
  clampPathX,
  clipContourAtX,
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

  it('khoang dao dong DOC TREN DUONG CONG THAT dung bang |curveHeight| * fontSize', () => {
    // Do bang lay mau day (khong phai quet y cua anchor/handle — do la khung
    // control-polygon, rong hon duong cong that no bao quanh) — doc lap voi
    // pathYExtent trong warp.ts, cung triet ly voi walkPath o tren.
    for (const curve of [0.5, 1, 2.5, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      const { lo, hi } = denseYExtent(path, SIZE);
      expect((hi - lo) * SIZE.height).toBeCloseTo(curve * FONT_SIZE, 1);
    }
  });

  it('trung diem dao dong DOC TREN DUONG CONG THAT nam dung tai baseline', () => {
    for (const curve of [0.5, 1, 2, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      const { lo, hi } = denseYExtent(path, SIZE);
      const midPx = ((lo + hi) / 2) * SIZE.height;
      expect(midPx).toBeCloseTo(0.5 * SIZE.height, 0);
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

// Cuc tri y doc lap, lay mau day thay vi giai tich — doc lap voi pathYExtent
// noi bo cua warp.ts (cung ly do voi walkPath o tren: khong dung chung code
// voi cai dang kiem tra).
function denseYExtent(path: WarpPath, size: { width: number; height: number }): { lo: number; hi: number } {
  const px = (p: { x: number; y: number }) => ({ x: p.x * size.width, y: p.y * size.height });
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = px(from);
    const p3 = px(to);
    const c1 = from.out ? px(from.out) : p0;
    const c2 = to.in ? px(to.in) : p3;
    const steps = 4000;
    for (let s = 0; s <= steps; s++) {
      const y = evalCubic(p0.y, c1.y, c2.y, p3.y, s / steps);
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
  }
  return { lo: lo / size.height, hi: hi / size.height };
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

  it('X(0) = 0 — mep trai chu luon bam diem dau path', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(0)).toBe(0);
  });

  it('do dai path (L) khong lam doi X tai cung mot x — het stretch theo ty le path', () => {
    // Truoc day (k = L/W) keo dai path se doi map.X(x) cho MOI x vi ca k
    // thay doi. Gio path chi quyet dinh HINH DANG uon, khong quyet dinh ty
    // le: keo dai anchor cuoi ra xa khong duoc lam doi vi tri X cua cac x
    // van con nam trong pham vi path CHUA keo dai.
    const short = WAVE();
    const stretchedLast = short.anchors[short.anchors.length - 1];
    const stretched: WarpPath = {
      ...short,
      anchors: short.anchors.map((a, i) =>
        i === short.anchors.length - 1 ? { ...a, x: stretchedLast.x + 1 } : a,
      ),
    };
    const m1 = buildWarpMap(short, SIZE, 50)!;
    const m2 = buildWarpMap(clampPathX(stretched), SIZE, 50)!;
    for (let x = 0; x <= 200; x += 10) {
      expect(m2.X(x)).toBeCloseTo(m1.X(x), 6);
      expect(m2.D(x)).toBeCloseTo(m1.D(x), 6);
    }
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

  it('L khop tham chieu doc lap duoi 0.05px', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    expect(Math.abs(map.L - walkPath(path, SIZE).total)).toBeLessThan(0.05);
  });

  it('X va D khop tham chieu doc lap duoi 0.05px tren toan hop', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    const ref = walkPath(path, SIZE);
    for (let x = 0; x <= SIZE.width; x += 2) {
      const p = ref.at(x);
      expect(Math.abs(map.X(x) - p.x)).toBeLessThan(0.05);
      // D neo vao baselineY (50, tham so thu 3 cua buildWarpMap o tren), khong
      // phai diem dau path — xem comment tren buildWarpMap.
      expect(Math.abs(map.D(x) - (p.y - 50))).toBeLessThan(0.05);
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
    for (let x = 0; x <= SIZE.width; x += 2) {
      const p = ref.at(x);
      expect(Math.abs(map.X(x) - p.x)).toBeLessThan(0.05);
      expect(Math.abs(map.D(x) - (p.y - 50))).toBeLessThan(0.05);
    }
  });

  it('kep ve dau/cuoi path khi x ra ngoai [0, L]', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(-100)).toBe(map.X(0));
    expect(map.D(-100)).toBe(map.D(0));
    expect(map.X(map.L + 500)).toBe(map.X(map.L));
    expect(map.D(map.L + 500)).toBe(map.D(map.L));
  });

  it('D neo o baselineY: tinh tien path doc keo D theo dung luong da tinh', () => {
    // Dich ca path len 0.1 (normalized) thi moi diem tren path dich len dung
    // 0.1*height px, con baselineY (mocc neo cua D) giu nguyen — nen D phai
    // tang dung luong do tai moi x. Day la hanh vi NGUOC voi truoc: baseline
    // phai bam theo path khi path bi dich, khong duoc dung yen (spec §2.2).
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
    const shiftPx = 0.1 * SIZE.height;
    for (let x = 0; x <= SIZE.width; x += 20) {
      expect(m2.D(x)).toBeCloseTo(m1.D(x) + shiftPx, 9);
      expect(m2.X(x)).toBeCloseTo(m1.X(x), 9);
    }
  });
});

// Map giai tich, khong qua bang tra: test nay do RIENG phan chia nho + ap
// affine, khong keo theo sai so cua buildWarpMap.
// He so 8/30 < 1 nen X don dieu tang; 0 <= X' <= 1.27.
const analytic: WarpMap = {
  L: Infinity, // khong gioi han — cac test o day do do chinh xac cua warp, khong do clip
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
    const identity: WarpMap = { L: Infinity, X: (x) => x, D: () => 0 };
    const box = rect(10, 20, 60, 80);
    expect(warpContours([shape(box)], identity)[0].outer).toEqual(box);
  });
});

describe('clipContourAtX', () => {
  it('contour hoan toan ben trong (maxX <= xMax) giu nguyen, khong doi', () => {
    const box = rect(10, 20, 60, 80);
    expect(clipContourAtX(box, 100)).toEqual([box]);
  });

  it('contour hoan toan ben ngoai (minX > xMax) bien mat hoan toan', () => {
    const box = rect(50, 20, 90, 80);
    expect(clipContourAtX(box, 30)).toEqual([]);
  });

  it('contour vat qua xMax bi cat: khong con diem nao vuot xMax, van la contour kin', () => {
    const box = rect(0, 0, 60, 40);
    const [out] = clipContourAtX(box, 25);
    expect(out).toBeDefined();
    for (let i = 0; i < out.length; i += 2) {
      expect(out[i]).toBeLessThanOrEqual(25 + 1e-6);
    }
    expect((out.length - 2) % 6).toBe(0);
    expect(out[out.length - 2]).toBeCloseTo(out[0], 9);
    expect(out[out.length - 1]).toBeCloseTo(out[1], 9);
    // Mep phai cua phan con lai phai cham dung xMax (khong lui vao trong).
    const xs = out.filter((_, i) => i % 2 === 0);
    expect(Math.max(...xs)).toBeCloseTo(25, 6);
  });

  it('contour tach thanh nhieu manh roi nhau khi phan noi giua bi cat het', () => {
    // Hinh "C nguoc": thanh tren (x 0-20,y 0-5) va thanh duoi (x 0-20,y 20-25)
    // chi noi voi nhau qua mot cau noi doc nam han o x >= 17. Cat tai x = 15
    // xoa het cau noi -> hai thanh con lai khong con cham nhau.
    const c: number[] = [0, 0];
    lineSeg(c, 0, 0, 20, 0);
    lineSeg(c, 20, 0, 20, 25);
    lineSeg(c, 20, 25, 0, 25);
    lineSeg(c, 0, 25, 0, 20);
    lineSeg(c, 0, 20, 17, 20);
    lineSeg(c, 17, 20, 17, 5);
    lineSeg(c, 17, 5, 0, 5);
    lineSeg(c, 0, 5, 0, 0);

    const pieces = clipContourAtX(c, 15);
    expect(pieces).toHaveLength(2);
    for (const piece of pieces) {
      for (let i = 0; i < piece.length; i += 2) {
        expect(piece[i]).toBeLessThanOrEqual(15 + 1e-6);
      }
    }
    const yRange = (piece: number[]) => {
      const ys = piece.filter((_, i) => i % 2 === 1);
      return [Math.min(...ys), Math.max(...ys)];
    };
    const ranges = pieces.map(yRange).sort((a, b) => a[0] - b[0]);
    expect(ranges[0][0]).toBeCloseTo(0, 6);
    expect(ranges[0][1]).toBeCloseTo(5, 6);
    expect(ranges[1][0]).toBeCloseTo(20, 6);
    expect(ranges[1][1]).toBeCloseTo(25, 6);
  });
});

describe('warpContours voi path ngan hon text (clip, khong stretch)', () => {
  it('phan text vuot qua do dai path (L) bi cat, khong con diem nao co x > L', () => {
    const map: WarpMap = { L: 40, X: (x) => Math.min(x, 40), D: () => 0 };
    const box = rect(0, 0, 100, 10);
    const [out] = warpContours([shape(box)], map);
    const xs = out.outer.filter((_, i) => i % 2 === 0);
    expect(Math.max(...xs)).toBeCloseTo(40, 6);
  });

  it('phan con lai (chua bi cat) giu dung kich thuoc goc, khong bi nen/gian', () => {
    // map identity tren doan [0, L]: neu clip dung, be rong phan con lai phai
    // bang dung min(box width, L) — khong bi scale theo ty le nao ca.
    const map: WarpMap = { L: 40, X: (x) => Math.min(x, 40), D: () => 0 };
    const box = rect(10, 0, 100, 10);
    const [out] = warpContours([shape(box)], map);
    const xs = out.outer.filter((_, i) => i % 2 === 0);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(30, 6); // [10, 40]
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

// arch/rise/flag/angle dung chung buildPresetPath voi wave — bang toa do lay
// thang tu docs/kittl-warp-reverse-engineered.md §4.3 (xem implement.md).
// Test o day danh cho DAC TRUNG RIENG cua tung preset (so anchor, co/khong co
// handle) + bat bien chung (identity tai 0, roundtrip curveHeightOf, X(0)=0,
// clampPathX hop le) ma ca 4 preset deu phai thoa, khong lap lai toan bo suite
// da co cho Wave.
const PRESETS = [
  { name: 'arch', build: buildArchPath, anchorCount: 3, hasHandles: true },
  { name: 'rise', build: buildRisePath, anchorCount: 3, hasHandles: true },
  { name: 'flag', build: buildFlagPath, anchorCount: 3, hasHandles: true },
  { name: 'angle', build: buildAnglePath, anchorCount: 2, hasHandles: false },
] as const;

describe.each(PRESETS)('preset $name (buildXxxPath)', ({ build, anchorCount, hasHandles }) => {
  it(`co dung ${anchorCount} anchor`, () => {
    expect(build(0.5, 0.8, FONT_SIZE, SIZE.height).anchors).toHaveLength(anchorCount);
  });

  it(hasHandles ? 'co 4 handle, anchor dau/cuoi chi co mot phia' : 'khong co handle nao', () => {
    const path = build(0.5, 0.8, FONT_SIZE, SIZE.height);
    const handles = path.anchors.flatMap((a) => [a.in, a.out]).filter(Boolean);
    expect(handles).toHaveLength(hasHandles ? 4 : 0);
    if (hasHandles) {
      expect(path.anchors[0].in).toBeUndefined();
      expect(path.anchors[path.anchors.length - 1].out).toBeUndefined();
    }
  });

  it('curveHeight = 0 cho duong nam ngang tuyet doi (identity)', () => {
    const path = build(0, 0.8, FONT_SIZE, SIZE.height);
    const ys = path.anchors.flatMap((a) =>
      [a.y, a.in?.y, a.out?.y].filter((v): v is number => v !== undefined),
    );
    expect(ys.every((y) => Math.abs(y - 0.8) < 1e-9)).toBe(true);
    expect(buildWarpMap(path, SIZE, 0.8 * SIZE.height)).toBeNull();
  });

  it('curveHeightOf doc nguoc dung con so da dung de sinh path, ca hai dau', () => {
    for (const curve of [-1, 0.25, 1, 2.5, 4]) {
      const path = build(curve, 0.5, FONT_SIZE, SIZE.height);
      expect(curveHeightOf(path, SIZE.height, FONT_SIZE)).toBeCloseTo(curve, 9);
    }
  });

  it('X(0) = 0 tinh theo path — mep trai chu bam diem dau path', () => {
    const path = clampPathX(build(1, 0.5, FONT_SIZE, SIZE.height));
    const map = buildWarpMap(path, SIZE, 50)!;
    expect(map).not.toBeNull();
    expect(map.X(0)).toBeCloseTo(path.anchors[0].x * SIZE.width, 6);
  });

  it('clampPathX giu tinh don dieu theo x tren path preset (kha nang no-op)', () => {
    const path = build(1, 0.5, FONT_SIZE, SIZE.height);
    const clamped = clampPathX(path);
    for (let i = 1; i < clamped.anchors.length; i++) {
      expect(clamped.anchors[i].x).toBeGreaterThanOrEqual(clamped.anchors[i - 1].x);
    }
  });
});

describe('buildAnglePath — cat (clipContourAtX) tren duong thang nghieng', () => {
  it('phan text vuot qua do dai path van bi cat het, khong stretch — giong Wave', () => {
    // Angle khong co cung cong (2 anchor, khong handle) nen moi segment la mot
    // "cubic suy bien" thanh doan thang — day la truong hop bien rieng cho
    // crossingsAtX/clipContourAtX so voi cac preset con lai (deu co cung cong).
    const path = clampPathX(buildAnglePath(2, 0.5, FONT_SIZE, SIZE.height));
    const map = buildWarpMap(path, SIZE, 50)!;
    expect(map).not.toBeNull();

    const out = warpContours([shape(rect(0, 0, SIZE.width * 2, 10))], map);
    for (const piece of out) {
      const xs = piece.outer.filter((_, i) => i % 2 === 0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(map.L + 1e-6);
    }
  });
});
