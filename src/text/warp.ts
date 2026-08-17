import type { Size, WarpAnchor, WarpPath } from '../schema';
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
// curveHeight = 0 cho ra một đường ngang đúng ngay tại baseline — tức warp
// trở thành phép đồng nhất.
//
// curveHeight đo bằng bội số của fontSize, giống Kittl: khoảng dao động dọc
// của path bằng đúng |curveHeight| * fontSize. Hình gốc dao động từ -0.4a tới
// +a, tức 1.4a, nên chia 1.4 để quy về đúng biên độ yêu cầu. Dấu âm lật cong.
export function buildWavePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  const a = boxHeight > 0 ? (curveHeight * fontSize) / (1.4 * boxHeight) : 0;
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

// f(x) chi xac dinh khi path la ham cua x. Dieu kien du: hoanh do anchor khong
// giam, va hai handle cua moi segment nam trong khoang hoanh do cua segment do
// — khi ay Bx'(t)/3 la dang Bernstein bac hai voi ca ba he so thoa a, c >= 0
// va (b >= 0 hoac b² <= ac), nen Bx' >= 0 (spec §2.3).
//
// Dat o day (khong phai UI) vi day la noi so huu WarpPath/buildDisplacement —
// resolveWarpPath cung goi ham nay cho path DA LUU, khong chi path dang keo,
// nen tai lieu cu (khong full-span [0,1] hoac khong don dieu) cung duoc chinh
// truoc khi vao buildDisplacement.
export function clampPathX(path: WarpPath): WarpPath {
  const anchors = path.anchors.map((anchor): WarpAnchor => ({ ...anchor }));
  const last = anchors.length - 1;
  if (last < 1) return path;

  // Hai mep ghim o 0 va 1 de f phu tron [0, width].
  anchors[0].x = 0;
  for (let i = 1; i <= last; i++) anchors[i].x = Math.max(anchors[i].x, anchors[i - 1].x);
  anchors[last].x = 1;
  for (let i = last - 1; i >= 1; i--) anchors[i].x = Math.min(anchors[i].x, anchors[i + 1].x);

  for (let i = 0; i < last; i++) {
    const lo = anchors[i].x;
    const hi = anchors[i + 1].x;
    const clamp = (v: number) => Math.min(Math.max(v, lo), hi);
    const out = anchors[i].out;
    if (out) anchors[i].out = { ...out, x: clamp(out.x) };
    const into = anchors[i + 1].in;
    if (into) anchors[i + 1].in = { ...into, x: clamp(into.x) };
  }

  return { ...path, anchors };
}

export interface WarpMap {
  X(x: number): number;
  D(x: number): number;
  L: number;
  k: number;
}

// Khoang cach tu diem toi DUONG THANG qua hai dau mut day cung. Bang tra gio
// duoc danh chi so theo do dai cung, tuc truy van la "cho s, tra diem" — mot
// cau hoi HINH HOC. Nen tieu chi phang phai la khoang cach hinh hoc, khac han
// tieu chi cu (sai lech DOC theo x) von phuc vu truy van "cho x, tra y".
// Dung khoang cach vuong goc thay vi so sanh theo tham so t: mot doan THANG co
// tham so hoa khong deu van phai duoc coi la phang, neu khong no bi chia toi
// het do sau ma khong ich gi.
function chordDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < EPSILON) return Math.hypot(px - ax, py - ay);
  return Math.abs((px - ax) * dy - (py - ay) * dx) / len;
}

// Day mau cuoi cua mot cung vao bang, chia doi cho toi khi day cung du sat.
// Chi day dau mut PHAI: dau mut trai da nam trong bang tu buoc truoc.
// Bo qua mau trung diem truoc do — `us` phai tang NGHIEM NGAT thi nhi phan
// trong lookup() moi co nghia.
function samplePath(
  xs: number[],
  ys: number[],
  us: number[],
  bx: Cubic,
  by: Cubic,
  depth: number,
): void {
  let flat = true;
  if (depth < MAX_DEPTH) {
    for (let k = 1; k < 4 && flat; k++) {
      const t = k / 4;
      const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
      const y = evalCubic(by[0], by[1], by[2], by[3], t);
      if (chordDistance(x, y, bx[0], by[0], bx[3], by[3]) > LUT_TOL) flat = false;
    }
  }
  if (flat) {
    const lastX = xs[xs.length - 1];
    const lastY = ys[ys.length - 1];
    const step = Math.hypot(bx[3] - lastX, by[3] - lastY);
    if (step < EPSILON) return;
    xs.push(bx[3]);
    ys.push(by[3]);
    us.push(us[us.length - 1] + step);
    return;
  }
  const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
  const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
  samplePath(xs, ys, us, lx.left, ly.left, depth + 1);
  samplePath(xs, ys, us, lx.right, ly.right, depth + 1);
}

// Path phang dung tai baseline => phep dong nhat. Phai chan tuong minh: X(x)
// duoc tra qua bang nen chi bang x trong sai so LUT, khong bang TUYET DOI nhu
// mo hinh cu (spec §2.5).
function isFlatAtBaseline(path: WarpPath, size: Size, baselineY: number): boolean {
  const flatY = (p: { y: number }) => Math.abs(p.y * size.height - baselineY) <= EPSILON;
  return path.anchors.every((a) => flatY(a) && (!a.in || flatY(a.in)) && (!a.out || flatY(a.out)));
}

// Bang tra theo DO DAI CUNG cho phep bien doi warp (spec §2.2):
//   s = clamp(k*x, 0, L),  (x, y) -> (P(s).x, P(s).y + y - y0)
// He so k = L/W la dang dong cua co che Kittl dat lai chieu rong layout bang L
// moi lan path doi — nho no ma be ngang chu khong doi khi tang do cong.
export function buildWarpMap(path: WarpPath, size: Size, baselineY: number): WarpMap | null {
  if (size.width <= 0 || size.height <= 0) return null;
  if (path.anchors.length < 2) return null;
  if (isFlatAtBaseline(path, size, baselineY)) return null;

  const xs: number[] = [];
  const ys: number[] = [];
  const us: number[] = [];
  const segments = segmentsOf(path, size);
  segments.forEach((s, i) => {
    if (i === 0) {
      xs.push(s.p0.x);
      ys.push(s.p0.y);
      us.push(0);
    }
    samplePath(xs, ys, us, [s.p0.x, s.c1.x, s.c2.x, s.p3.x], [s.p0.y, s.c1.y, s.c2.y, s.p3.y], 0);
  });

  const L = us[us.length - 1];
  if (!(L > EPSILON)) return null;
  const y0 = ys[0];
  const k = L / size.width;

  const lookup = (x: number): { x: number; y: number } => {
    const s = Math.min(Math.max(k * x, 0), L);
    if (s <= 0) return { x: xs[0], y: ys[0] };
    if (s >= L) return { x: xs[xs.length - 1], y: ys[ys.length - 1] };
    let low = 0;
    let high = us.length - 1;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (us[mid] <= s) low = mid;
      else high = mid;
    }
    const span = us[high] - us[low];
    const r = span < EPSILON ? 0 : (s - us[low]) / span;
    return {
      x: xs[low] + (xs[high] - xs[low]) * r,
      y: ys[low] + (ys[high] - ys[low]) * r,
    };
  };

  return {
    L,
    k,
    X: (x) => lookup(x).x,
    D: (x) => lookup(x).y - y0,
  };
}

const WARP_TOL = 0.05; // px

// Ap phep AFFINE HAI CHIEU len ca 4 control point:
//   x' = ax + bxc*x        y' = y + ay + byc*x
// tuc ma tran [[bxc, 0], [byc, 1]], tinh tien (ax, ay). Chinh xac TUYET DOI:
// co so Bernstein co tong bang 1 nen anh cua mot duong Bezier qua phep affine
// A chinh la duong Bezier co control point A(c_i). Chung minh cu (mo hinh dich
// chuyen doc) la truong hop rieng bxc = 0 cua dung lap luan nay.
//
// Chi day 3 diem (c1, c2, p3): diem mo dau da do nguoi goi ghi.
function pushWarped(
  out: number[],
  bx: Cubic,
  by: Cubic,
  ax: number,
  bxc: number,
  ay: number,
  byc: number,
): void {
  for (let i = 1; i < 4; i++) out.push(ax + bxc * bx[i], by[i] + ay + byc * bx[i]);
}

function warpSegment(out: number[], bx: Cubic, by: Cubic, map: WarpMap, depth: number): void {
  // Khoang hoanh do THAT cua segment: hai dau mut cong cac cuc tri cua Bx.
  // Rong hon [p0.x, p3.x] o nhung segment vong lai — do chinh la cho hai ham
  // affine phai ngoai suy, nen phai do sai so o day.
  let xa = Math.min(bx[0], bx[3]);
  let xb = Math.max(bx[0], bx[3]);
  for (const t of extrema(bx[0], bx[1], bx[2], bx[3])) {
    const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
    if (x < xa) xa = x;
    if (x > xb) xb = x;
  }

  const dx = bx[3] - bx[0];
  // NOI SUY tai hai dau mut on-curve (khong phai day cung tren [xa, xb]): diem
  // noi hai segment ke nhau duoc luu MOT lan trong Contour, hai ben phai cho
  // cung gia tri tai hoanh do do thi contour moi kin va khong gay khuc. Dung
  // MIN_DX (dinh nghia o phia duoi cho displaceSegment) lam nguong: cung mot y
  // nghia hinh hoc (net doc), nen dung chung mot hang so thay vi khai bao lai.
  let bxc: number;
  let ax: number;
  let byc: number;
  let ay: number;
  if (Math.abs(dx) < MIN_DX) {
    bxc = 0;
    ax = map.X(bx[0]);
    byc = 0;
    ay = map.D(bx[0]);
  } else {
    bxc = (map.X(bx[3]) - map.X(bx[0])) / dx;
    ax = map.X(bx[0]) - bxc * bx[0];
    byc = (map.D(bx[3]) - map.D(bx[0])) / dx;
    ay = map.D(bx[0]) - byc * bx[0];
  }

  if (depth < MAX_DEPTH) {
    let worst = 0;
    for (let k = 0; k <= 4; k++) {
      const x = xa + ((xb - xa) * k) / 4;
      const ex = Math.abs(map.X(x) - (ax + bxc * x));
      const ey = Math.abs(map.D(x) - (ay + byc * x));
      if (ex > worst) worst = ex;
      if (ey > worst) worst = ey;
    }
    if (worst > WARP_TOL) {
      const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
      const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
      warpSegment(out, lx.left, ly.left, map, depth + 1);
      warpSegment(out, lx.right, ly.right, map, depth + 1);
      return;
    }
  }
  pushWarped(out, bx, by, ax, bxc, ay, byc);
}

function warpContour(contour: Contour, map: WarpMap): Contour {
  const out: number[] = [map.X(contour[0]), contour[1] + map.D(contour[0])];
  for (let i = 0; i + 7 < contour.length; i += 6) {
    warpSegment(
      out,
      [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]],
      [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]],
      map,
      0,
    );
  }
  return out;
}

// Phep bien doi duy nhat cua warp: (x, y) -> (X(x), y + D(x)). Ap cho TUNG
// DIEM chu khong tung glyph — net doc (x hang) van thang dung va giu nguyen do
// dai, net ngang uon theo duong cong va bi nen/gian theo do doc.
//
// Thu tu hoanh do giua cac glyph duoc giu nho X DON DIEU, ma tinh don dieu do
// den tu clampPathX. Day la cho yeu hon mo hinh cu: truoc kia hoanh do khong
// bao gio bi ghi nen va cham glyph la bat kha thi ve mat toan hoc; gio no phu
// thuoc mot bat bien do noi khac bao dam.
export function warpContours(shapes: GlyphShape[], map: WarpMap): GlyphShape[] {
  return shapes.map((shape) => ({
    outer: warpContour(shape.outer, map),
    holes: shape.holes.map((hole) => warpContour(hole, map)),
  }));
}

const LUT_TOL = 0.01; // px — sai lech DOC toi da giua cung va day cung theo x
// Depth 8 la noi thuat toan tu hoi tu theo tieu chi sai so hai truc, do o
// curveHeight = 4 (bien do lon nhat slider cho phep) tren hop 400x120. Depth
// 9 la bien an toan mot muc: thap hon thi tran do sau am tham bo qua kiem tra
// sai so, dung loi da tung gap voi MAX_DEPTH = 8 cua mo hinh cu.
const MAX_DEPTH = 9;

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
    outer: displaceContour(shape.outer, f),
    holes: shape.holes.map((hole) => displaceContour(hole, f)),
  }));
}
