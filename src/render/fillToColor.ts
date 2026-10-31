import { FillGradient, type ColorSource, type StrokeStyle } from 'pixi.js';
import type { Fill } from '../schema';

// Approximate-solid-color version, kept for call sites that need a plain
// ColorSource (e.g. Application background, which isn't a Graphics fill and
// can't take a gradient).
export function fillToColor(fill: Fill): ColorSource {
  switch (fill.type) {
    case 'solid':
      return fill.color;
    case 'linear-gradient':
    case 'radial-gradient':
      return fill.stops[0]?.color ?? '#000000';
    case 'texture':
      return '#808080';
  }
}

// Resolves a schema Fill to a real Pixi FillInput for Graphics.fill()/
// .stroke() and Text `fill`/`stroke` style — uses Pixi v8's native
// FillGradient for linear/radial gradients instead of a custom shader.
// `texture` still falls back to an approximate solid color: real asset
// rendering needs the asset pipeline, which is Phase 4 scope.
//
// `box` (text): gradient trải theo hộp node 0..width × 0..height thay vì bounds
// của từng shape — chữ vẽ mỗi glyph một fill() riêng, 'local' sẽ làm gradient
// bắt đầu lại ở mỗi chữ. Cùng một gradient như 'local' trên hộp đó (toạ độ
// chuẩn hoá 0..1, quy ước chung với svgSerializer), viết lại thành toạ độ px
// 'global' (xem boxGradient).
export function resolveFill(fill: Fill, box?: { width: number; height: number }): ColorSource | FillGradient {
  if (box && box.width > 0 && box.height > 0 && (fill.type === 'linear-gradient' || fill.type === 'radial-gradient')) {
    return boxGradient(fill, box.width, box.height);
  }
  switch (fill.type) {
    case 'solid':
      // ponytail: per-fill alpha isn't composited here (only node-level
      // opacity is, in applyTransform.ts) — same scope cut the prior
      // solid-only fillToColor already had.
      return fill.color;
    case 'linear-gradient': {
      const dx = Math.cos(fill.angle) * 0.5;
      const dy = Math.sin(fill.angle) * 0.5;
      const gradient = new FillGradient({
        type: 'linear',
        start: { x: 0.5 - dx, y: 0.5 - dy },
        end: { x: 0.5 + dx, y: 0.5 + dy },
        textureSpace: 'local',
      });
      for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
      return gradient;
    }
    case 'radial-gradient': {
      const gradient = new FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        textureSpace: 'local',
      });
      for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
      return gradient;
    }
    case 'texture':
      return '#808080';
  }
}

// Gradient chuẩn hoá trên hộp w×h, viết bằng toạ độ px 'global'.
// Linear: trong không gian chuẩn hoá giá trị là f = (n − s)·d (|d| = 1, s =
// điểm đầu); với n = (x/w, y/h) thì ∇f theo px là g = (dx/w, dy/h) — nên đoạn
// px tương đương đi từ S = (s.x·w, s.y·h) tới S + g/|g|² (đường đồng mức
// nghiêng y như 'local' trên hộp không vuông). Radial: elip w/2 × h/2 ở tâm hộp
// = vòng tròn bán kính trục dài, ép trục ngắn bằng scale (xoay 90° khi h > w).
function boxGradient(
  fill: Extract<Fill, { type: 'linear-gradient' | 'radial-gradient' }>,
  w: number,
  h: number,
): FillGradient {
  let gradient: FillGradient;
  if (fill.type === 'linear-gradient') {
    const dx = Math.cos(fill.angle);
    const dy = Math.sin(fill.angle);
    const gx = dx / w;
    const gy = dy / h;
    const g2 = gx * gx + gy * gy;
    const start = { x: (0.5 - dx / 2) * w, y: (0.5 - dy / 2) * h };
    gradient = new FillGradient({
      type: 'linear',
      start,
      end: { x: start.x + gx / g2, y: start.y + gy / g2 },
      textureSpace: 'global',
    });
  } else {
    const center = { x: w / 2, y: h / 2 };
    gradient = new FillGradient({
      type: 'radial',
      center,
      innerRadius: 0,
      outerCenter: center,
      outerRadius: Math.max(w, h) / 2,
      scale: Math.min(w, h) / Math.max(w, h),
      rotation: h > w ? Math.PI / 2 : 0,
      textureSpace: 'global',
    });
  }
  for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
  return gradient;
}

// StrokeStyle takes a gradient under a separate `fill` key from the plain
// `color` key used for solids — resolveFill() returns whichever FillInput
// is correct, this just routes it to the matching StrokeStyle field. Shared
// by shapeRenderer.ts and textRenderer.ts (both stroke via Pixi's
// FillStyle/StrokeStyle shape).
export function strokeColorFields(fill: Fill): Pick<StrokeStyle, 'color' | 'fill'> {
  const resolved = resolveFill(fill);
  return resolved instanceof FillGradient ? { fill: resolved } : { color: resolved };
}

