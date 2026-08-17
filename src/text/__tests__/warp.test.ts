import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { buildDisplacement, buildWavePath, displaceContours } from '../warp';
import { evalCubic } from '../bezier';
import type { GlyphShape } from '../glyphOutlines';

const SIZE = { width: 400, height: 100 };

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

function shape(points: number[]): GlyphShape {
  return { outer: points, holes: [] };
}

// Nghich dao doc lap: tim t sao cho Bx(t) = x bang chia doi, roi tra By(t).
// Khong dung lai code cua buildDisplacement — day la ban doi chieu.
function curveYAt(path: WarpPath, size: { width: number; height: number }, x: number): number {
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const px = [from.x, (from.out ?? from).x, (to.in ?? to).x, to.x].map((v) => v * size.width);
    const py = [from.y, (from.out ?? from).y, (to.in ?? to).y, to.y].map((v) => v * size.height);
    if (x < px[0] || x > px[3]) continue;
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 80; k++) {
      const m = (lo + hi) / 2;
      if (evalCubic(px[0], px[1], px[2], px[3], m) < x) lo = m;
      else hi = m;
    }
    return evalCubic(py[0], py[1], py[2], py[3], (lo + hi) / 2);
  }
  throw new Error(`x = ${x} nam ngoai path`);
}

describe('buildDisplacement', () => {
  it('path phang dung tai baseline cho f = 0 TUYET DOI', () => {
    const f = buildDisplacement(buildWavePath(0, 0.5), SIZE, 50);
    for (let x = -50; x <= 450; x += 25) expect(f(x)).toBe(0);
  });

  it('path phang lech baseline cho hang so dung bang do lech', () => {
    const flatPath = (y: number): WarpPath => ({
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y, out: { x: 0.33, y } },
        { x: 1, y, in: { x: 0.66, y } },
      ],
    });
    const f = buildDisplacement(flatPath(0.8), SIZE, 50);
    expect(f(0)).toBeCloseTo(30, 9);
    expect(f(123.4)).toBeCloseTo(30, 9);
    expect(f(400)).toBeCloseTo(30, 9);
  });

  it('kep ve gia tri dau mut khi x ra ngoai khoang', () => {
    const f = buildDisplacement(buildWavePath(1, 0.5), SIZE, 50);
    expect(f(-100)).toBe(f(0));
    expect(f(900)).toBe(f(400));
  });

  it('khop duong cong that duoi 0.011px tren preset wave', () => {
    const path = buildWavePath(1, 0.5);
    const f = buildDisplacement(path, SIZE, 50);
    for (let x = 0; x <= 400; x += 4) {
      expect(Math.abs(f(x) - (curveYAt(path, SIZE, x) - 50))).toBeLessThan(0.011);
    }
  });

  it('path DOC: sai so do theo phuong DOC van duoi nguong', () => {
    // Handle keo gan het bien do dung trong mot doan x rat hep => cung cuc doc.
    // Day la truong hop can vuong goc noi doi tra: no van bao 0.01px trong khi
    // sai so doc lon hon nhieu lan.
    const steep: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.05, out: { x: 0.02, y: 0.95 } },
        { x: 1, y: 0.95, in: { x: 0.98, y: 0.05 } },
      ],
    };
    const f = buildDisplacement(steep, SIZE, 50);
    for (let x = 0; x <= 400; x += 2) {
      expect(Math.abs(f(x) - (curveYAt(steep, SIZE, x) - 50))).toBeLessThan(0.011);
    }
  });

  it('path duoi 2 anchor cho f = 0', () => {
    const single: WarpPath = { role: 'baseline', closed: false, anchors: [{ x: 0, y: 0.5 }] };
    expect(buildDisplacement(single, SIZE, 50)(100)).toBe(0);
  });
});

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

const wavy = (x: number) => 12 * Math.sin(x / 25);

describe('displaceContours', () => {
  it('f = 0 la phep dong nhat, khong chia nho gi', () => {
    const box = rect(10, 20, 60, 80);
    const [out] = displaceContours([shape(box)], () => 0);
    expect(out.outer).toEqual(box);
  });

  it('B2 — hoanh do khong bao gio bi ghi', () => {
    // Cong hang so vao f khong lam doi sai so tuyen tinh hoa (alpha dich theo,
    // beta giu nguyen) => hai lan chay chia nho y HET nhau. Vay hoanh do phai
    // trung dung bit, con tung do lech dung bang hang so do.
    const box = rect(10, 20, 60, 80);
    const a = displaceContours([shape(box)], wavy)[0].outer;
    const b = displaceContours([shape(box)], (x) => wavy(x) + 1000)[0].outer;
    expect(b.length).toBe(a.length);
    for (let i = 0; i < a.length; i += 2) {
      expect(b[i]).toBe(a[i]);
      expect(b[i + 1] - a[i + 1]).toBeCloseTo(1000, 9);
    }
  });

  it('B3 — net doc van doc va giu nguyen do dai', () => {
    // Canh phai cua hop: x = 60 co dinh, y chay tu 20 xuong 80.
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box)], wavy)[0].outer;
    const onRightEdge = [];
    for (let i = 0; i < out.length; i += 2) {
      if (Math.abs(out[i] - 60) < 1e-9) onRightEdge.push(out[i + 1]);
    }
    expect(onRightEdge.length).toBeGreaterThanOrEqual(2);
    // Ca canh nhan cung mot do lech => hieu y giua hai dau van dung 60.
    expect(Math.max(...onRightEdge) - Math.min(...onRightEdge)).toBeCloseTo(60, 9);
  });

  it('B7 — dinh dang 2 + 6n va contour kin TUYET DOI', () => {
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box)], wavy)[0].outer;
    expect((out.length - 2) % 6).toBe(0);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('B11 — segment co cuc tri hoanh do van khop chinh xac o moi noi', () => {
    // Segment cuoi vong sang phai toi x ~ 15 roi quay ve x = 0, tuc p0.x = 10
    // nam han trong (xa, xb). Day cung tren [xa, xb] se lam diem dong lech
    // khoi diem mo; noi suy dau mut thi khong.
    const c = [0, 0];
    lineSeg(c, 0, 0, 10, 0);
    lineSeg(c, 10, 0, 10, 20);
    c.push(30, 25, -15, 5, 0, 0);
    const out = displaceContours([shape(c)], wavy)[0].outer;
    expect(out[0]).toBe(0);
    expect(out[1]).toBeCloseTo(wavy(0), 12);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('B6 — sai so tuyen tinh hoa bi chan boi DISPLACE_TOL', () => {
    // Lay mau day tren ket qua roi tru f(x): moi diem phai roi ve dung mot
    // canh ngang cua hop goc (y = 20 hoac y = 80) trong pham vi DISPLACE_TOL.
    // Canh doc thi x hang nen bo qua.
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box)], wavy)[0].outer;
    for (let i = 0; i + 7 < out.length; i += 6) {
      const vertical = Math.abs(out[i + 6] - out[i]) < 1e-9;
      if (vertical) continue;
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const x = evalCubic(out[i], out[i + 2], out[i + 4], out[i + 6], t);
        const y = evalCubic(out[i + 1], out[i + 3], out[i + 5], out[i + 7], t);
        const y0 = y - wavy(x);
        expect(Math.min(Math.abs(y0 - 20), Math.abs(y0 - 80))).toBeLessThan(0.051);
      }
    }
  });

  it('chia nho lam tang so segment tren f cong manh', () => {
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box)], wavy)[0].outer;
    expect(out.length).toBeGreaterThan(box.length);
  });

  it('ap ca cho holes', () => {
    const outer = rect(0, 0, 100, 100);
    const hole = rect(30, 30, 70, 70);
    const [out] = displaceContours([{ outer, holes: [hole] }], wavy);
    expect(out.holes).toHaveLength(1);
    expect(out.holes[0]).not.toEqual(hole);
    expect(out.holes[0][0]).toBe(30);
  });
});
