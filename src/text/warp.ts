import type { Size, WarpPath } from '../schema';
import type { Contour, GlyphShape } from './glyphOutlines';
import { type Cubic, evalCubic, extrema, splitCubic } from './bezier';

export interface Point {
  x: number;
  y: number;
}

const EPSILON = 1e-6;

interface Segment {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
}

function segmentsOf(path: WarpPath, size: Size): Segment[] {
  const toPx = (p: { x: number; y: number }): Point => ({
    x: p.x * size.width,
    y: p.y * size.height,
  });
  const segments: Segment[] = [];
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = toPx(from);
    const p3 = toPx(to);
    segments.push({ p0, c1: from.out ? toPx(from.out) : p0, c2: to.in ? toPx(to.in) : p3, p3 });
  }
  return segments;
}

// Đúng cấu trúc docs/wave-transformation.md mô tả: 1 path mở, 3 anchor,
// 4 handle, tổng 7 point hiển thị. baselineRatio = baselineY / height, nên
// intensity = 0 cho ra một đường ngang đúng ngay tại baseline — tức warp
// trở thành phép đồng nhất.
export function buildWavePath(intensity: number, baselineRatio: number): WarpPath {
  const a = intensity * 0.4;
  const b = baselineRatio;
  return {
    role: 'baseline',
    closed: false,
    anchors: [
      // Xuất phát thấp bên trái, handle nằm ngang: đoạn đầu gần như thẳng
      // rồi mới cong lên (tài liệu §6, đoạn 1).
      { x: 0, y: b + a, out: { x: 0.2, y: b + a } },
      // Hai handle đối xứng qua anchor giữa ⇒ thẳng hàng, chuyển tiếp mượt
      // giữa hai đoạn cong (tài liệu §2).
      { x: 0.5, y: b, in: { x: 0.35, y: b + 0.15 * a }, out: { x: 0.65, y: b - 0.15 * a } },
      // Handle vào nằm *trên* anchor cuối ⇒ cung lớn vồng lên ở khoảng
      // giữa-phải rồi hạ xuống điểm kết thúc (tài liệu §6, đoạn 2).
      { x: 1, y: b + 0.6 * a, in: { x: 0.75, y: b - 0.4 * a } },
    ],
  };
}

const LUT_TOL = 0.01; // px — sai lech DOC toi da giua cung va day cung theo x
// Depth 9 la noi thuat toan tu hoi tu dung theo tieu chi flatness dung cho
// duong cong doc nhat da test (khong nho tran). Depth 10 la bien an toan 1
// muc: thap hon 9 co the am tham cat bot do chinh xac duoi LUT_TOL.
const MAX_DEPTH = 10;

// Day mau cuoi cua mot cung vao bang, chia doi cho toi khi day cung du sat.
// Chi day dau mut PHAI: dau mut trai da nam trong bang tu buoc truoc.
function sampleSegment(xs: number[], ys: number[], bx: Cubic, by: Cubic, depth: number): void {
  const dx = bx[3] - bx[0];
  let flat = true;
  if (depth < MAX_DEPTH && Math.abs(dx) > EPSILON) {
    const slope = (by[3] - by[0]) / dx;
    for (let k = 1; k < 4 && flat; k++) {
      const t = k / 4;
      const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
      const y = evalCubic(by[0], by[1], by[2], by[3], t);
      if (Math.abs(y - (by[0] + slope * (x - bx[0]))) > LUT_TOL) flat = false;
    }
  }
  if (flat) {
    xs.push(bx[3]);
    ys.push(by[3]);
    return;
  }
  const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
  const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
  sampleSegment(xs, ys, lx.left, ly.left, depth + 1);
  sampleSegment(xs, ys, lx.right, ly.right, depth + 1);
}

// f(x) = do lech doc cua warp path tai hoanh do x, tinh tu baseline phang.
// intensity = 0 cho path nam dung tai baseline nen f = 0 tuyet doi — warp
// tro thanh phep dong nhat, khong con sai so lam tron nao.
export function buildDisplacement(
  path: WarpPath,
  size: Size,
  baselineY: number,
): (x: number) => number {
  const xs: number[] = [];
  const ys: number[] = [];
  const segments = segmentsOf(path, size);
  segments.forEach((s, i) => {
    if (i === 0) {
      xs.push(s.p0.x);
      ys.push(s.p0.y);
    }
    sampleSegment(xs, ys, [s.p0.x, s.c1.x, s.c2.x, s.p3.x], [s.p0.y, s.c1.y, s.c2.y, s.p3.y], 0);
  });
  if (xs.length === 0) return () => 0;

  // Phong thu: path quat nguoc (le ra da bi UI chan, xem spec §2.3) lam bang
  // het don dieu, nhi phan mat nghia. Suy giam muot bang cach quet tim mau co
  // x gan nhat, thay vi tra ra rac.
  let monotone = true;
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] < xs[i - 1]) {
      monotone = false;
      break;
    }
  }

  return (x: number): number => {
    if (!monotone) {
      let best = 0;
      for (let i = 1; i < xs.length; i++) {
        if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
      }
      return ys[best] - baselineY;
    }
    if (x <= xs[0]) return ys[0] - baselineY;
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1] - baselineY;

    let low = 0;
    let high = xs.length - 1;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (xs[mid] <= x) low = mid;
      else high = mid;
    }
    const span = xs[high] - xs[low];
    const k = span < EPSILON ? 0 : (x - xs[low]) / span;
    return ys[low] + (ys[high] - ys[low]) * k - baselineY;
  };
}

const DISPLACE_TOL = 0.05; // px
// Duoi nguong nay, (f(x3) - f(x0))/dx bi nhieu cua bang LUT nuot chung — he
// so goc thanh rac. Dung hang so f(p0.x) thay the: van khop moi noi vi hai
// dau mut cach nhau duoi MIN_DX nen f o hai ben lech khong dang ke.
const MIN_DX = 1e-6;

// Ap phep affine L(x) = alpha + beta·x len ca 4 control point. Chinh xac
// TUYET DOI khi L affine: co so Bernstein co tong bang 1 nen hang so alpha co
// control point deu bang alpha, con beta·Bx co control point beta·(cp x). Vay
// By + L(Bx) co control point thu i dung bang c_i.y + L(c_i.x).
//
// Chi day 3 diem (c1, c2, p3): diem mo dau da do nguoi goi ghi.
function pushDisplaced(out: number[], bx: Cubic, by: Cubic, alpha: number, beta: number): void {
  for (let i = 1; i < 4; i++) out.push(bx[i], by[i] + alpha + beta * bx[i]);
}

function displaceSegment(
  out: number[],
  bx: Cubic,
  by: Cubic,
  f: (x: number) => number,
  depth: number,
): void {
  // Khoang hoanh do THAT cua segment: hai dau mut cong cac cuc tri cua Bx.
  // Rong hon [p0.x, p3.x] o nhung segment vong lai — do chinh la cho L phai
  // ngoai suy, nen phai do sai so o day chu khong chi giua hai dau mut.
  let xa = Math.min(bx[0], bx[3]);
  let xb = Math.max(bx[0], bx[3]);
  for (const t of extrema(bx[0], bx[1], bx[2], bx[3])) {
    const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
    if (x < xa) xa = x;
    if (x > xb) xb = x;
  }

  const dx = bx[3] - bx[0];
  // L NOI SUY f tai hai dau mut on-curve (khong phai day cung tren [xa, xb]):
  // diem noi hai segment ke nhau duoc luu MOT lan trong Contour, hai ben phai
  // cho cung mot gia tri tai hoanh do do thi contour moi kin va khong gay khuc.
  let beta: number;
  let alpha: number;
  if (Math.abs(dx) < MIN_DX) {
    beta = 0;
    alpha = f(bx[0]);
  } else {
    beta = (f(bx[3]) - f(bx[0])) / dx;
    alpha = f(bx[0]) - beta * bx[0];
  }

  if (depth < MAX_DEPTH) {
    let worst = 0;
    for (let k = 0; k <= 4; k++) {
      const x = xa + ((xb - xa) * k) / 4;
      const d = Math.abs(f(x) - (alpha + beta * x));
      if (d > worst) worst = d;
    }
    if (worst > DISPLACE_TOL) {
      const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
      const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
      displaceSegment(out, lx.left, ly.left, f, depth + 1);
      displaceSegment(out, lx.right, ly.right, f, depth + 1);
      return;
    }
  }
  pushDisplaced(out, bx, by, alpha, beta);
}

function displaceContour(contour: Contour, f: (x: number) => number): Contour {
  const out: number[] = [contour[0], contour[1] + f(contour[0])];
  for (let i = 0; i + 7 < contour.length; i += 6) {
    displaceSegment(
      out,
      [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]],
      [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]],
      f,
      0,
    );
  }
  return out;
}

// Phep bien doi duy nhat cua warp: (x, y) -> (x, y + f(x)). Ap cho TUNG DIEM
// chu khong tung glyph — net doc (x hang) dich deu nen van thang dung va giu
// nguyen do dai, net ngang uon theo duong cong.
//
// Hoanh do khong bao gio bi ghi, nen khoang cach ngang giua hai glyph luon
// dung advance tu nhien => va cham glyph bat kha thi ve mat toan hoc.
export function displaceContours(shapes: GlyphShape[], f: (x: number) => number): GlyphShape[] {
  return shapes.map((shape) => ({
    ...shape,
    outer: displaceContour(shape.outer, f),
    holes: shape.holes.map((hole) => displaceContour(hole, f)),
  }));
}
