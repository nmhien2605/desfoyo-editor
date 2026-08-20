import { transformContour } from './circleWarp';
import type { Contour, GlyphShape } from './glyphOutlines';
import type { PathFrame } from './warp';

// Custom = rigid-transform-per-glyph theo mot path MO (khac warp.ts uon tung
// diem contour, khac circleWarp.ts dat theo cong thuc vong tron) — xem
// implement.md va docs/kittl-custom-reverse-engineered.md §4b (bang chung do
// tren Kittl: glyph khong meo, path cat NGANG QUA TAM doc cua chu).
//
// pivot xoay = (shapePivotX[i], centerY) — centerY la HANG SO cho ca dong
// (xem layout.ts's TextLayout.centerY), khac Circle dung baselineY.
//
// Glyph co pivotX ngoai [0, frame.L] bi LOAI NGUYEN (khong ve), khac
// clipContourAtX cua warp family (cat mot phan contour) — rigid transform
// khong the cat nua glyph ma giu dung hinh dang.
export function warpContoursOnPath(
  shapes: GlyphShape[],
  shapePivotX: number[],
  centerY: number,
  frame: PathFrame,
): GlyphShape[] {
  const out: GlyphShape[] = [];
  shapes.forEach((shape, i) => {
    const s = shapePivotX[i];
    if (s < 0 || s > frame.L) return;
    const theta = frame.angle(s);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const placeX = frame.X(s);
    const placeY = frame.Y(s);
    const apply = (c: Contour) => transformContour(c, cos, sin, s, centerY, placeX, placeY);
    out.push({ outer: apply(shape.outer), holes: shape.holes.map(apply) });
  });
  return out;
}
