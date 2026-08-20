import type { Contour, GlyphShape } from './glyphOutlines';

export interface CircleWarpParams {
  cx: number;
  cy: number;
  r: number;
  directionInverted: boolean;
}

// Phep affine tuyet doi (khong xap xi) — cung ly do voi pushWarped trong
// warp.ts: co so Bernstein tong bang 1 nen ap R(theta) len tung control point
// giu duong cong Bezier CHINH XAC, du la rigid transform chu khong phai warp
// diem-theo-diem nhu warp.ts.
// Export: customWarp.ts (Custom text transform) dung lai dung phep affine
// nay cho rigid-transform-per-glyph theo path mo, thay vi theo vong tron —
// xem implement.md.
export function transformContour(
  contour: Contour,
  cos: number,
  sin: number,
  pivotX: number,
  pivotY: number,
  placeX: number,
  placeY: number,
): Contour {
  const out = new Array<number>(contour.length);
  for (let i = 0; i < contour.length; i += 2) {
    const dx = contour[i] - pivotX;
    const dy = contour[i + 1] - pivotY;
    out[i] = placeX + cos * dx - sin * dy;
    out[i + 1] = placeY + sin * dx + cos * dy;
  }
  return out;
}

// Cong thuc da kiem chung bang so tren runtime Kittl that — xem
// docs/kittl-circle-reverse-engineered.md §3/§4/§5 (Kabsch/Procrustes fit tren
// tung glyph, sai so ~1e-13px). Khac han warp.ts: Circle ap MOT phep rigid
// transform (xoay + tinh tien nguyen khoi, khong meo) cho CA glyph, khong phai
// bien doi tung diem contour.
//
// phi = goc tren vong tron noi pivot cua glyph "cam" vao — dung pivotX TRUC
// TIEP, KHONG tru cx: diem bat dau (s=0, ung voi phi=sign*pi/2) khong doi vi
// tri khi keo handle doi tam/ban kinh (da do duoc — xem tai lieu §4).
// theta = goc xoay ap cho toan bo diem cua glyph = phi + sign*(pi/2) — da
// verify khop TUYET DOI (4 chu so thap phan, 5/5 glyph) cho sign=+1; cho
// sign=-1 suy ra bang dai so tu vector "len" cuc bo cua glyph va khop dung
// voi huong do duoc (tai lieu §5).
//
// Text dai hon chu vi: phi khong bi clamp o day => tu nhien chong lan (khong
// cat) — dung hanh vi da quan sat, khong can code rieng.
export function warpContoursCircle(
  shapes: GlyphShape[],
  shapePivotX: number[],
  baselineY: number,
  params: CircleWarpParams,
): GlyphShape[] {
  const sign = params.directionInverted ? -1 : 1;
  return shapes.map((shape, i) => {
    const pivotX = shapePivotX[i];
    const phi = sign * (Math.PI / 2 + pivotX / params.r);
    const theta = phi + sign * (Math.PI / 2);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const placeX = params.cx + params.r * Math.cos(phi);
    const placeY = params.cy + params.r * Math.sin(phi);
    const apply = (c: Contour) =>
      transformContour(c, cos, sin, pivotX, baselineY, placeX, placeY);
    return { outer: apply(shape.outer), holes: shape.holes.map(apply) };
  });
}
