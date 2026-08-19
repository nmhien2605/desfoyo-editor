import type { Size, WarpAnchor, WarpPath } from '../schema';
import { containsPoint, type Contour, type GlyphShape } from './glyphOutlines';
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

// Moi preset (wave/arch/rise/flag/angle) la CUNG mot phep bien doi: hinh dang
// don vi (a=1, b=0) co dinh, roi curveHeight/baselineRatio chi quy dinh a
// (bien do) va b (tam dao dong) qua DUNG mot cong thuc — xem buildWavePath
// truoc day. Gom logic nay vao mot ham dung chung de them preset moi chi can
// khai bao bang toa do (unitAnchors) + cuc tri do mot lan (unitExtent), khong
// phai chep lai cong thuc a/b.
function buildPresetPath(
  unitAnchors: (a: number, b: number) => WarpAnchor[],
  unitExtent: { lo: number; hi: number },
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  const realSpread = unitExtent.hi - unitExtent.lo;
  const realMid = (unitExtent.hi + unitExtent.lo) / 2;
  const a = boxHeight > 0 ? (curveHeight * fontSize) / boxHeight / realSpread : 0;
  const b = baselineRatio - realMid * a;
  return { role: 'baseline', closed: false, anchors: unitAnchors(a, b) };
}

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
  return buildPresetPath(unitWaveAnchors, UNIT_WAVE_EXTENT, curveHeight, baselineRatio, fontSize, boxHeight);
}

// Bang toa do 3 anchor + 4 handle cua arch/rise/flag lay THANG tu
// docs/kittl-warp-reverse-engineered.md §4.3 (do truc tiep tu runtime Kittl,
// khong phai tu suy dien): pts[0]/pts[3]/pts[6] la 3 anchor, pts[1] la handle
// out cua anchor dau, pts[2]/pts[4] la handle in/out cua anchor giua, pts[5]
// la handle in cua anchor cuoi (dung cau truc Bs() cua Kittl). O day viet
// truc tiep duoi dang y = b + a * T.y (T la gia tri trong bang goc, tuc gia
// tri tai a=1, b=0) de dung chung buildPresetPath — khong doi x, khong lat
// truc: quy uoc y-down, chuan hoa 0..1 theo bbox trung voi WarpPath cua ta.
function unitArchAnchors(a: number, b: number): WarpAnchor[] {
  return [
    { x: 0, y: b + a, out: { x: 0.2, y: b + 0.7 * a } },
    { x: 0.5, y: b + 0.65 * a, in: { x: 0.33, y: b + 0.65 * a }, out: { x: 0.67, y: b + 0.65 * a } },
    { x: 1, y: b + a, in: { x: 0.8, y: b + 0.7 * a } },
  ];
}
const UNIT_ARCH_EXTENT = pathYExtent(
  { role: 'baseline', closed: false, anchors: unitArchAnchors(1, 0) },
  { width: 1, height: 1 },
);
export function buildArchPath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  return buildPresetPath(unitArchAnchors, UNIT_ARCH_EXTENT, curveHeight, baselineRatio, fontSize, boxHeight);
}

// Bang goc (docs/kittl-warp-reverse-engineered.md §4.3):
// rise: [(0,1), (.25,.95), (.4,.75), (.6,.6), (.75,.5), (.8,.45), (1,.5)]
function unitRiseAnchors(a: number, b: number): WarpAnchor[] {
  return [
    { x: 0, y: b + a, out: { x: 0.25, y: b + 0.95 * a } },
    { x: 0.6, y: b + 0.6 * a, in: { x: 0.4, y: b + 0.75 * a }, out: { x: 0.75, y: b + 0.5 * a } },
    { x: 1, y: b + 0.5 * a, in: { x: 0.8, y: b + 0.45 * a } },
  ];
}
const UNIT_RISE_EXTENT = pathYExtent(
  { role: 'baseline', closed: false, anchors: unitRiseAnchors(1, 0) },
  { width: 1, height: 1 },
);
export function buildRisePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  return buildPresetPath(unitRiseAnchors, UNIT_RISE_EXTENT, curveHeight, baselineRatio, fontSize, boxHeight);
}

// Bang goc (docs/kittl-warp-reverse-engineered.md §4.3):
// flag: [(0,.85), (.2,1), (.35,1), (.5,.85), (.65,.7), (.8,.7), (1,.85)]
function unitFlagAnchors(a: number, b: number): WarpAnchor[] {
  return [
    { x: 0, y: b + 0.85 * a, out: { x: 0.2, y: b + a } },
    { x: 0.5, y: b + 0.85 * a, in: { x: 0.35, y: b + a }, out: { x: 0.65, y: b + 0.7 * a } },
    { x: 1, y: b + 0.85 * a, in: { x: 0.8, y: b + 0.7 * a } },
  ];
}
const UNIT_FLAG_EXTENT = pathYExtent(
  { role: 'baseline', closed: false, anchors: unitFlagAnchors(1, 0) },
  { width: 1, height: 1 },
);
export function buildFlagPath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  return buildPresetPath(unitFlagAnchors, UNIT_FLAG_EXTENT, curveHeight, baselineRatio, fontSize, boxHeight);
}

// Angle la truong hop rieng: 2 anchor, KHONG handle (doan thang nghieng) —
// bang goc §4.3: angle: [(0,1), (1,.4)]. listHandles()/WarpHandlesOverlay.tsx
// da tong quat theo WarpAnchor.in/out co mat hay khong nen khong can sua UI:
// path 2 anchor khong handle tu dong khong hien tay cam nao.
function unitAngleAnchors(a: number, b: number): WarpAnchor[] {
  return [
    { x: 0, y: b + a },
    { x: 1, y: b + 0.4 * a },
  ];
}
const UNIT_ANGLE_EXTENT = pathYExtent(
  { role: 'baseline', closed: false, anchors: unitAngleAnchors(1, 0) },
  { width: 1, height: 1 },
);
export function buildAnglePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  return buildPresetPath(unitAngleAnchors, UNIT_ANGLE_EXTENT, curveHeight, baselineRatio, fontSize, boxHeight);
}

// Doc nguoc curveHeight tu mot path bat ky — nghich dao cua buildWavePath ve
// mat bien do, do TREN DUONG CONG THAT bang pathYExtent (cung phep do voi
// buildWavePath, nen buildWavePath -> curveHeightOf la roundtrip chinh xac).
// Can khi user keo handle: slider phai theo kip hinh, neu khong lan keo
// slider ke tiep se lam hinh nhay. Kittl lam dung viec nay trong setPoints.
//
// Dau lay theo chieu diem dau so voi TRUNG DIEM dao dong that (lo+hi)/2 —
// KHONG phai so voi diem cuoi. Ly do doi tu "first vs last": Arch va Flag co
// anchor dau/cuoi CUNG mot y (hinh doi xung qua truc doc, bien do nam het o
// handle) nen first >= last luon hoa ra bang nhau, khong bao gio doc duoc dau
// am — buoc buildArchPath/buildFlagPath voi curveHeight < 0 di qua day se sai.
// "first vs mid" dung duoc cho CA 5 preset vi he so T.y cua diem dau (x=0)
// trong moi bang goc (wave=1, arch=1, rise=1, flag=.85, angle=1) DEU DUONG:
// y_dau - mid = a * T.y[dau], T.y[dau] > 0 ⇒ dau(y_dau - mid) = dau(a), voi
// moi preset — bat bien nay khong phu thuoc hinh dang co doi xung hay khong,
// chi can T.y[dau] != 0 (dung cho toan bo preset dang co).
export function curveHeightOf(path: WarpPath, boxHeight: number, fontSize: number): number {
  if (fontSize <= 0 || path.anchors.length < 2) return 0;
  const { lo, hi } = pathYExtent(path, { width: 1, height: 1 });
  const spread = ((hi - lo) * boxHeight) / fontSize;
  const mid = (lo + hi) / 2;
  const first = path.anchors[0].y;
  const signed = first >= mid ? spread : -spread;
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

  // Anchor dau/cuoi tu do theo x — khong con ghim 0/1, keo dai/ngan duoc path.
  // Chi con dam bao DON DIEU: anchor giua khong duoc vuot qua 2 anchor dau,
  // giu f(x) la ham cua x (spec §2.3 cua docs/superpowers/specs/2026-08-17-text-warp-arclength-design.md).
  // Vong lap forward/backward chi so sanh voi gia tri THAT cua
  // anchors[0]/anchors[last] (khong con la hang so 0/1 co dinh), nen van
  // dung dan voi bat ky vi tri nao cua 2 dau mut.
  for (let i = 1; i <= last; i++) anchors[i].x = Math.max(anchors[i].x, anchors[i - 1].x);
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

// Bang tra theo DO DAI CUNG cho phep bien doi warp:
//   s = clamp(x, 0, L),  (x, y) -> (P(s).x, P(s).y + y - baselineY)
// KHONG con he so k = L/W nhu spec §2.2/§2.3 cu (docs/superpowers/specs/
// 2026-08-17-text-warp-arclength-design.md): truoc day k ep be rong layout W
// khop dung do dai cung L moi lan path doi, nghia la KEO/NEN toan bo chu theo
// ti le L/W moi khi nguoi dung keo dai/ngan path (anchor dau/cuoi tu do theo x
// tu Task 1 cua docs/superpowers/plans/2026-08-18-warp-endpoint-resize.md).
// Yeu cau moi: kich thuoc ky tu KHONG duoc doi theo do dai path — chi vi tri
// dat doc theo cung doi. Bo k = dat x truc tiep bang do dai cung (khong quy
// doi ti le), tuc tung ky tu giu dung kich thuoc goc; buildWarpMap goi o duoi
// van dung clipContourAtX() de cat bo phan text vuot qua L khi path ngan hon
// be rong text (thay vi don ep no vao dung mot diem cuoi path).
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

  const lookup = (x: number): { x: number; y: number } => {
    const s = Math.min(Math.max(x, 0), L);
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

const EPSILON_T = 1e-9; // nguong tren tham so t (0..1), khac ty le voi EPSILON pixel

// Cat mot cubic (theo mot truc) tai global-parameter [t0, t1] — dung 2 lan
// splitCubic (de Casteljau), nen chinh xac TUYET DOI, khong xap xi.
function subCubic(v: Cubic, t0: number, t1: number): Cubic {
  if (t0 <= 0 && t1 >= 1) return v;
  const head = t0 > 0 ? splitCubic(v[0], v[1], v[2], v[3], t0).right : v;
  if (t1 >= 1) return head;
  const u = (t1 - t0) / (1 - t0);
  return splitCubic(head[0], head[1], head[2], head[3], u).left;
}

// Tat ca nghiem cua Bx(t) = xMax trong (0,1), sap tang dan. Chia doan theo
// cuc tri (extrema()) thanh cac doan DON DIEU truoc — mot cubic co toi da 2
// cuc tri noi bo nen toi da 3 doan don dieu, moi doan co toi da 1 nghiem, tim
// bang nhi phan (dung ham chung evalCubic voi phan con lai cua file).
function crossingsAtX(bx: Cubic, xMax: number): number[] {
  const breaks = [0, ...extrema(bx[0], bx[1], bx[2], bx[3]), 1].sort((a, b) => a - b);
  const roots: number[] = [];
  for (let i = 0; i < breaks.length - 1; i++) {
    const t0 = breaks[i];
    const t1 = breaks[i + 1];
    if (t1 - t0 < EPSILON_T) continue;
    const f0 = evalCubic(bx[0], bx[1], bx[2], bx[3], t0) - xMax;
    if (Math.abs(f0) < EPSILON) {
      roots.push(t0);
      continue;
    }
    const f1 = evalCubic(bx[0], bx[1], bx[2], bx[3], t1) - xMax;
    if (f0 < 0 === f1 < 0) continue;
    let lo = t0;
    let hi = t1;
    let flo = f0;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const fm = evalCubic(bx[0], bx[1], bx[2], bx[3], mid) - xMax;
      if (fm < 0 === flo < 0) {
        lo = mid;
        flo = fm;
      } else hi = mid;
    }
    roots.push((lo + hi) / 2);
  }
  return roots;
}

// Noi diem cuoi ve diem dau bang mot canh THANG bieu dien duoi dang cubic voi
// control point chia deu — dung quy uoc cua glyphOutlines.ts's line(). Bien
// mot doan 'inside' rieng le (bi cat tai x = L) thanh mot contour KIN.
function closeWithStraightEdge(points: number[]): void {
  const x0 = points[0];
  const y0 = points[1];
  const xn = points[points.length - 2];
  const yn = points[points.length - 1];
  if (Math.abs(xn - x0) < EPSILON && Math.abs(yn - y0) < EPSILON) return;
  points.push(
    xn + (x0 - xn) / 3,
    yn + (y0 - yn) / 3,
    xn + (2 * (x0 - xn)) / 3,
    yn + (2 * (y0 - yn)) / 3,
    x0,
    y0,
  );
}

interface TaggedPiece {
  bx: Cubic;
  by: Cubic;
  inside: boolean;
}

// Cat mot contour KIN theo dieu kien x <= xMax, tra ve 0..N contour KIN moi —
// nhieu hon 1 khi phan con lai (sau khi cat) tach thanh cac mieng roi nhau.
// Dung khi path warp ngan hon be rong text: phan text vuot qua L phai BIEN
// MAT (khong hien thi), khac voi clamp/ngoai suy (chu van hien, chi bi don
// vao 1 diem hoac keo dai ra ngoai path).
//
// Thuat toan: tach moi doan cubic tai cac nghiem cua Bx(t) = xMax thanh cac
// mieng khong doi dau, roi noi cac mieng 'inside' lien tiep thanh contour con,
// dong lai bang canh thang tai bien cat. Xoay danh sach de bat dau ngay sau
// mot mieng 'outside' — vi day la vong KIN, mot run 'inside' co the vat qua
// diem noi dau/cuoi mang neu khong xoay truoc.
export function clipContourAtX(contour: Contour, xMax: number): Contour[] {
  const segCount = (contour.length - 2) / 6;
  if (segCount === 0) return [];

  // Duong tat dung tinh bao loi (convex hull) cua Bezier: neu MOI control
  // point (ca on-curve lan tay cam) cung mot phia thi ca cung chac chan cung
  // phia do — khong can di qua thuat toan cat o duoi. Day la truong hop pho
  // bien nhat (path dai hon text, L >= W).
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < contour.length; i += 2) {
    if (contour[i] < minX) minX = contour[i];
    if (contour[i] > maxX) maxX = contour[i];
  }
  if (maxX <= xMax + EPSILON) return [contour];
  if (minX > xMax + EPSILON) return [];

  const pieces: TaggedPiece[] = [];
  for (let s = 0; s < segCount; s++) {
    const i = s * 6;
    const bx: Cubic = [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]];
    const by: Cubic = [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]];
    const ts = [0, ...crossingsAtX(bx, xMax), 1];
    for (let k = 0; k < ts.length - 1; k++) {
      const t0 = ts[k];
      const t1 = ts[k + 1];
      if (t1 - t0 < EPSILON_T) continue;
      const mid = (t0 + t1) / 2;
      const inside = evalCubic(bx[0], bx[1], bx[2], bx[3], mid) <= xMax;
      pieces.push({ bx: subCubic(bx, t0, t1), by: subCubic(by, t0, t1), inside });
    }
  }

  const firstOutside = pieces.findIndex((p) => !p.inside);
  if (firstOutside === -1) return [contour]; // fast-path o tren le ra da bat, giu day cho chac

  const rotated = [...pieces.slice(firstOutside + 1), ...pieces.slice(0, firstOutside + 1)];
  const out: Contour[] = [];
  let current: number[] | null = null;
  for (const piece of rotated) {
    if (!piece.inside) {
      if (current) {
        closeWithStraightEdge(current);
        out.push(current);
        current = null;
      }
      continue;
    }
    if (!current) current = [piece.bx[0], piece.by[0]];
    current.push(piece.bx[1], piece.by[1], piece.bx[2], piece.by[2], piece.bx[3], piece.by[3]);
  }
  if (current) {
    closeWithStraightEdge(current);
    out.push(current);
  }
  return out;
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
//
// Cat truoc khi warp (clipContourAtX voi map.L) chu khong sau: cat dung tren
// toa do GOC (chua bien doi) noi x chinh la khoang cach doc theo cung tinh tu
// diem dau path — dung y nghia "phan text vuot qua do dai path". Neu cat SAU
// warp thi bien x = L da bi map.X() bien thanh mot duong cong, kho xac dinh
// diem cat chinh xac.
//
// Thuong outer chi tach thanh 1 mieng (hoac khong doi neu L >= W, truong hop
// pho bien) nen holes duoc gan thang vao no. Chi khi outer tach thanh nhieu
// mieng roi nhau (hiem, thuong la path bi keo rat ngan giua mot glyph rong)
// moi can dung containsPoint (dung lai logic groupIntoShapes cua
// glyphOutlines.ts) de biet mieng hole nao thuoc mieng outer nao.
export function warpContours(shapes: GlyphShape[], map: WarpMap): GlyphShape[] {
  const out: GlyphShape[] = [];
  for (const shape of shapes) {
    const outerPieces = clipContourAtX(shape.outer, map.L);
    if (outerPieces.length === 0) continue;
    const holePieces = shape.holes.flatMap((hole) => clipContourAtX(hole, map.L));

    if (outerPieces.length === 1) {
      out.push({
        outer: warpContour(outerPieces[0], map),
        holes: holePieces.map((hole) => warpContour(hole, map)),
      });
      continue;
    }

    for (const piece of outerPieces) {
      const holes = holePieces.filter((hole) => containsPoint(piece, hole[0], hole[1]));
      out.push({
        outer: warpContour(piece, map),
        holes: holes.map((hole) => warpContour(hole, map)),
      });
    }
  }
  return out;
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
