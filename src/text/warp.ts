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

// Cuc tri y THAT cua duong cong (khong phai khung control-polygon): dung
// chung extrema()/evalCubic() voi shapesBounds() trong textGeometry.ts. Ca
// buildWavePath (chuan hoa bien do preset) lan curveHeightOf (doc nguoc tu
// path bi keo tay bat ky) can cung mot phep do nay — tach rieng de hai ham
// khong tu lam theo hai kieu khac nhau.
function pathYExtent(path: WarpPath, size: Size): { lo: number; hi: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const seg of segmentsOf(path, size)) {
    const by: Cubic = [seg.p0.y, seg.c1.y, seg.c2.y, seg.p3.y];
    const ys = [by[0], by[3], ...extrema(...by).map((t) => evalCubic(...by, t))];
    for (const y of ys) {
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
  }
  return { lo, hi };
}

// Hinh dang co dinh cua preset (ty le handle khong doi voi curveHeight/b) —
// dung de do cuc tri y THAT mot lan duy nhat o module scope, roi quy doi
// nguoc lai thanh he so a/b can dung. Tach rieng vi buildWavePath goi ham
// nay voi a=1,b=0 con anchorsAt() (ben duoi) goi lai voi a,b that.
function unitWaveAnchors(a: number, b: number): WarpAnchor[] {
  return [
    // Xuat phat thap ben trai, handle nam ngang: doan dau gan nhu thang
    // roi moi cong len (tai lieu §6, doan 1).
    { x: 0, y: b + a, out: { x: 0.2, y: b + a } },
    // Hai handle doi xung qua anchor giua ⇒ thang hang, chuyen tiep muot
    // giua hai doan cong (tai lieu §2).
    { x: 0.5, y: b, in: { x: 0.35, y: b + 0.15 * a }, out: { x: 0.65, y: b - 0.15 * a } },
    // Handle vao nam *tren* anchor cuoi ⇒ cung lon vong len o khoang
    // giua-phai roi ha xuong diem ket thuc (tai lieu §6, doan 2).
    { x: 1, y: b + 0.6 * a, in: { x: 0.75, y: b - 0.4 * a } },
  ];
}

// Cuc tri y THAT (khong phai khung control-polygon) cua hinh dang don vi
// (a=1, b=0) — hang so vi ty le handle o unitWaveAnchors khong doi theo tham
// so goi. Dung de quy doi curveHeight (bien do tren duong cong that, theo
// boi so fontSize) va baseline (trung diem dao dong that) sang he so a/b cua
// control-polygon can dung khi dung anchors.
const UNIT_WAVE_EXTENT = pathYExtent(
  { role: 'baseline', closed: false, anchors: unitWaveAnchors(1, 0) },
  { width: 1, height: 1 },
);

// Dung cau truc docs/wave-transformation.md mo ta: 1 path mo, 3 anchor,
// 4 handle, tong 7 point hien thi. curveHeight = 0 cho ra mot duong ngang
// dung ngay tai baseline — tuc warp tro thanh phep dong nhat.
//
// curveHeight do bang boi so cua fontSize, giong Kittl: khoang dao dong doc
// CUA DUONG CONG THAT (khong phai control-polygon) bang dung |curveHeight| *
// fontSize, va TRUNG DIEM dao dong that nam dung tai baseline (spec §5.1) —
// tuc curveHeight=0 la phep dong nhat tuyet doi, con curveHeight khac 0 chi
// lam chu "lon song" quanh baseline, khong lam ca khoi chu troi di.
export function buildWavePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  const realSpread = UNIT_WAVE_EXTENT.hi - UNIT_WAVE_EXTENT.lo;
  const realMid = (UNIT_WAVE_EXTENT.hi + UNIT_WAVE_EXTENT.lo) / 2;
  const a = boxHeight > 0 ? (curveHeight * fontSize) / boxHeight / realSpread : 0;
  const b = baselineRatio - realMid * a;
  return { role: 'baseline', closed: false, anchors: unitWaveAnchors(a, b) };
}

// Doc nguoc curveHeight tu mot path bat ky — nghich dao cua buildWavePath ve
// mat bien do, do TREN DUONG CONG THAT bang pathYExtent (cung phep do voi
// buildWavePath, nen buildWavePath -> curveHeightOf la roundtrip chinh xac).
// Can khi user keo handle: slider phai theo kip hinh, neu khong lan keo
// slider ke tiep se lam hinh nhay. Kittl lam dung viec nay trong setPoints.
//
// Dau lay theo chieu diem dau so voi diem cuoi, dung quy uoc cua buildWavePath
// (a > 0 dat anchor dau CAO hon anchor cuoi theo he toa do y-xuong).
export function curveHeightOf(path: WarpPath, boxHeight: number, fontSize: number): number {
  if (fontSize <= 0 || path.anchors.length < 2) return 0;
  const { lo, hi } = pathYExtent(path, { width: 1, height: 1 });
  const spread = ((hi - lo) * boxHeight) / fontSize;
  const first = path.anchors[0].y;
  const last = path.anchors[path.anchors.length - 1].y;
  const signed = first >= last ? spread : -spread;
  return Math.min(4, Math.max(-1, signed));
}

// f(x) chi xac dinh khi path la ham cua x. Dieu kien du: hoanh do anchor khong
// giam, va hai handle cua moi segment nam trong khoang hoanh do cua segment do
// — khi ay Bx'(t)/3 la dang Bernstein bac hai voi ca ba he so thoa a, c >= 0
// va (b >= 0 hoac b² <= ac), nen Bx' >= 0 (spec §2.3).
//
// Dat o day (khong phai UI) vi day la noi so huu WarpPath/buildWarpMap —
// resolveWarpPath cung goi ham nay cho path DA LUU, khong chi path dang keo,
// nen tai lieu cu (khong full-span [0,1] hoac khong don dieu) cung duoc chinh
// truoc khi vao buildWarpMap.
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
//   s = clamp(k*x, 0, L),  (x, y) -> (P(s).x, P(s).y + y - baselineY)
// He so k = L/W la dang dong cua co che Kittl dat lai chieu rong layout bang L
// moi lan path doi — nho no ma be ngang chu khong doi khi tang do cong.
//
// D neo vao baselineY (khong phai diem dau path): baseline phai TRUNG dung gia
// tri y cua path tai vi tri tuong ung, khong chi theo hinh dang tuong doi cua
// path. Neu neo vao diem dau path, dich ca path len/xuong se khong doi ket
// qua gi — path ve tren canvas va chu thuc te se lech nhau, dung bang khoang
// diem dau path lech khoi baseline. Neo vao baselineY thi keo path len/xuong
// se keo chu theo dung nhu vay, dung ky vong WYSIWYG cua nguoi dung.
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
    D: (x) => lookup(x).y - baselineY,
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
  // MIN_DX (dinh nghia o phia duoi) lam nguong: cung mot y nghia hinh hoc
  // (net doc), nen dung chung mot hang so thay vi khai bao lai.
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

// Duoi nguong nay, do doc (f(x3) - f(x0))/dx bi nhieu cua bang LUT nuot chung
// — he so goc thanh rac. Dung hang so f(p0.x) thay the: van khop moi noi vi
// hai dau mut cach nhau duoi MIN_DX nen f o hai ben lech khong dang ke.
const MIN_DX = 1e-6;
