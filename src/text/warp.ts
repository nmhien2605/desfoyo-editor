import type { Size, WarpPath } from '../schema';
import type { Contour, GlyphShape } from './glyphOutlines';
import { type Cubic, evalCubic, evalD1, evalD2, evalD3, splitCubic } from './bezier';

export interface Point {
  x: number;
  y: number;
}

export interface PathSampler {
  length: number;
  at(distance: number): { point: Point; tangent: Point };
}

const FLATNESS_TOL = 0.01; // px
const MIN_STEPS = 8;
const MAX_STEPS = 256;
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

// Cận sai số chuẩn của xấp xỉ cubic bằng n đoạn thẳng: sai số ≤ (3/4)·M/n²
// với M là hiệu bậc hai lớn nhất của đa giác điều khiển. Thay cho 32 mẫu
// cố định — cung càng gắt càng nhiều mẫu, cung thoải thì ít.
function stepsFor(s: Segment): number {
  const m = Math.max(
    Math.hypot(s.p0.x - 2 * s.c1.x + s.c2.x, s.p0.y - 2 * s.c1.y + s.c2.y),
    Math.hypot(s.c1.x - 2 * s.c2.x + s.p3.x, s.c1.y - 2 * s.c2.y + s.p3.y),
  );
  const n = Math.ceil(Math.sqrt((0.75 * m) / FLATNESS_TOL));
  return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Number.isFinite(n) ? n : MIN_STEPS));
}

function pointAt(s: Segment, t: number): Point {
  return {
    x: evalCubic(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
    y: evalCubic(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
  };
}

// B'(t) = 0 ở cusp và ở anchor thiếu handle (c1 = p0). Theo quy tắc
// L'Hôpital, hướng tiếp tuyến khi đó là hướng của đạo hàm bậc cao kế tiếp.
// Trả null chỉ khi cả segment suy biến thành một điểm.
function tangentAt(s: Segment, t: number): Point | null {
  const candidates: Point[] = [
    {
      x: evalD1(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
      y: evalD1(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
    },
    {
      x: evalD2(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
      y: evalD2(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
    },
    {
      x: evalD3(s.p0.x, s.c1.x, s.c2.x, s.p3.x),
      y: evalD3(s.p0.y, s.c1.y, s.c2.y, s.p3.y),
    },
  ];
  for (const v of candidates) {
    const n = Math.hypot(v.x, v.y);
    if (n > EPSILON) return { x: v.x / n, y: v.y / n };
  }
  return null;
}

// Chỉ tổng chiều dài, không dựng bảng — solveHorizontalScale gọi hàm này
// vài chục lần cho mỗi lần layout nên không muốn cấp phát bảng mỗi vòng.
export function arcLength(path: WarpPath, size: Size): number {
  let total = 0;
  let prev: Point | null = null;
  for (const s of segmentsOf(path, size)) {
    const n = stepsFor(s);
    for (let k = 0; k <= n; k++) {
      const p = pointAt(s, k / n);
      if (prev) total += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
  }
  return total;
}

// Chuyển path chuẩn hoá 0..1 thành bảng {khoảng cách tích luỹ, tham số} trong
// px. Tra cứu theo arc-length (chứ không theo tham số t của bezier) là điều
// kiện để chữ phân bố đều dọc đường cong — tham số t chạy nhanh chậm không
// đều. Lấy mẫu thích ứng theo độ cong (stepsFor) thay cho số mẫu cố định, và
// tangent tính giải tích từ đạo hàm bezier thay vì xấp xỉ bằng dây cung.
export function buildPathSampler(path: WarpPath, size: Size): PathSampler {
  const segments = segmentsOf(path, size);
  const entries: { seg: number; t: number; s: number }[] = [];
  let acc = 0;
  let prev: Point | null = null;

  segments.forEach((segment, si) => {
    const n = stepsFor(segment);
    for (let k = 0; k <= n; k++) {
      // Mẫu đầu của mọi đoạn trừ đoạn đầu tiên trùng mẫu cuối của đoạn
      // trước — giữ lại sẽ tạo một bước dài 0 trong bảng arc-length.
      if (si > 0 && k === 0) continue;
      const t = k / n;
      const p = pointAt(segment, t);
      if (prev) acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      entries.push({ seg: si, t, s: acc });
      prev = p;
    }
  });

  const length = acc;
  // Dùng khi một segment suy biến hẳn thành điểm: mượn hướng của chỗ khác
  // trên path thay vì trả vector không.
  let fallback: Point = { x: 1, y: 0 };
  for (const entry of entries) {
    const t = tangentAt(segments[entry.seg], entry.t);
    if (t) {
      fallback = t;
      break;
    }
  }

  return {
    length,
    at(distance: number) {
      if (entries.length === 0) return { point: { x: 0, y: 0 }, tangent: fallback };
      if (entries.length < 2 || length < EPSILON) {
        const first = entries[0];
        return {
          point: pointAt(segments[first.seg], first.t),
          tangent: tangentAt(segments[first.seg], first.t) ?? fallback,
        };
      }
      const clamped = Math.min(Math.max(distance, 0), length);

      let low = 0;
      let high = entries.length - 1;
      while (high - low > 1) {
        const mid = (low + high) >> 1;
        if (entries[mid].s <= clamped) low = mid;
        else high = mid;
      }

      const span = entries[high].s - entries[low].s;
      const f = span < EPSILON ? 0 : (clamped - entries[low].s) / span;
      // Khoảng bắc cầu giữa hai segment: mẫu `low` là t=1 của segment trước,
      // trùng điểm với t=0 của segment sau — nội suy trong segment sau.
      const sameSegment = entries[low].seg === entries[high].seg;
      const seg = sameSegment ? entries[low].seg : entries[high].seg;
      const t = sameSegment
        ? entries[low].t + (entries[high].t - entries[low].t) * f
        : entries[high].t * f;

      // Điểm: nội suy tuyến tính trực tiếp giữa hai mẫu đã có sẵn (dây cung
      // cục bộ), KHÔNG tái tính pointAt(seg, t) từ t nội suy — vì quan hệ
      // s(t) phi tuyến trong mỗi bước, tái tính theo t làm sai số vượt quá
      // sai số dây cung, phá test dung sai chặt của path thẳng-tốc-độ-đổi.
      // Tangent vẫn lấy giải tích tại t nội suy như spec.
      const pLow = pointAt(segments[entries[low].seg], entries[low].t);
      const pHigh = pointAt(segments[entries[high].seg], entries[high].t);

      return {
        point: { x: pLow.x + (pHigh.x - pLow.x) * f, y: pLow.y + (pHigh.y - pLow.y) * f },
        tangent: tangentAt(segments[seg], t) ?? fallback,
      };
    },
  };
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

// Đặt từng glyph lên path như một khối cứng, theo ngữ nghĩa SVG <textPath>:
// điểm neo là trung điểm advance của glyph, glyph được xoay quanh điểm
// baseline của chính nó theo tiếp tuyến tại đó rồi tịnh tiến.
//
// Ma trận [T | N] trực chuẩn (‖T‖ = 1, N ⊥ T) nên phép biến đổi bảo toàn
// khoảng cách — hình glyph không thể méo. Đây là điểm khác căn bản với bản
// cũ, vốn tra tiếp tuyến riêng cho *từng điểm* outline.
//
// pathBaselineY là baseline dòng đầu (mốc quy chiếu của path). Dòng thứ i
// chạy trên offset curve cách path một khoảng (baselineY - pathBaselineY)
// theo pháp tuyến.
export function placeOnPath(
  shapes: GlyphShape[],
  sampler: PathSampler,
  pathBaselineY: number,
): GlyphShape[] {
  const placed: GlyphShape[] = [];
  for (const shape of shapes) {
    // Glyph vượt quá cuối path thì không vẽ (ngữ nghĩa SVG textPath). Với
    // path preset đã fit thì nhánh này không bao giờ chạy.
    if (shape.anchorX > sampler.length) continue;

    const { point, tangent } = sampler.at(shape.anchorX);
    const nx = -tangent.y;
    const ny = tangent.x;
    const offset = shape.baselineY - pathBaselineY;
    const ox = point.x + nx * offset;
    const oy = point.y + ny * offset;

    const place = (contour: Contour): Contour => {
      const out = new Array<number>(contour.length);
      for (let i = 0; i < contour.length; i += 2) {
        const dx = contour[i] - shape.anchorX;
        const dy = contour[i + 1] - shape.baselineY;
        out[i] = ox + tangent.x * dx + nx * dy;
        out[i + 1] = oy + tangent.y * dx + ny * dy;
      }
      return out;
    };

    placed.push({
      outer: place(shape.outer),
      holes: shape.holes.map(place),
      anchorX: shape.anchorX,
      baselineY: shape.baselineY,
    });
  }
  return placed;
}

// Co toạ độ x của path quanh TÂM NGANG của hộp (không quanh gốc): nếu co
// quanh gốc, chữ sẽ trượt dần sang trái khi intensity tăng, trong khi
// node.size.width không đổi. k = 1 là phép đồng nhất.
export function bakeScale(path: WarpPath, k: number): WarpPath {
  const scale = (p: { x: number; y: number }) => ({ x: (p.x - 0.5) * k + 0.5, y: p.y });
  return {
    ...path,
    anchors: path.anchors.map((anchor) => ({
      ...scale(anchor),
      ...(anchor.in ? { in: scale(anchor.in) } : {}),
      ...(anchor.out ? { out: scale(anchor.out) } : {}),
    })),
  };
}

const MIN_SCALE = 0.05;
const LENGTH_TOL = 0.01; // px

// Giải k sao cho arcLength(bakeScale(path, k)) ≈ target.
//
// Bisection hợp lệ vì L(k) = ∫√(k²x′² + y′²)dt tăng ngặt theo k > 0:
// dL/dk = ∫ k·x′²/√(k²x′² + y′²) dt ≥ 0, dương ở mọi nơi x′ ≠ 0.
//
// Path preset trải x ∈ [0, W] nên L(1) ≥ W = target ⇒ nghiệm nằm trong (0,1].
// Nhánh MIN_SCALE bắt trường hợp biên độ dọc lớn tới mức co hết cỡ vẫn dài
// hơn target — khi đó glyph tràn sẽ bị placeOnPath bỏ, đúng quy ước §2.3.
export function solveHorizontalScale(path: WarpPath, size: Size, target: number): number {
  if (target < EPSILON) return 1;
  if (arcLength(path, size) <= target) return 1;
  if (arcLength(bakeScale(path, MIN_SCALE), size) >= target) return MIN_SCALE;

  let low = MIN_SCALE;
  let high = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const length = arcLength(bakeScale(path, mid), size);
    if (Math.abs(length - target) < LENGTH_TOL) return mid;
    if (length > target) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

const LUT_TOL = 0.01; // px — sai lech DOC toi da giua cung va day cung theo x
const MAX_DEPTH = 8;

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
    sampleSegment(
      xs,
      ys,
      [s.p0.x, s.c1.x, s.c2.x, s.p3.x],
      [s.p0.y, s.c1.y, s.c2.y, s.p3.y],
      0,
    );
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
