import { translateContour, type GlyphShape } from './glyphOutlines';
import type { Effect } from '../schema';

export interface ShadowLayer {
  shapes: GlyphShape[];
  mode: 'fill' | 'stroke';
}

export function findTextShadow(
  effects: Effect[] | undefined,
): Extract<Effect, { type: 'text-shadow' }> | undefined {
  return effects?.find((e): e is Extract<Effect, { type: 'text-shadow' }> => e.type === 'text-shadow');
}

const DEFAULT_3D_STEPS = 6;

function translateShapes(shapes: GlyphShape[], dx: number, dy: number): GlyphShape[] {
  return shapes.map((shape) => ({
    outer: translateContour(shape.outer, dx, dy),
    holes: shape.holes.map((hole) => translateContour(hole, dx, dy)),
  }));
}

// distance duoc luu theo TI LE cua font.size (khong phai px tuyet doi) de
// bong tu dong co gian theo co chu (FR-04) ma khong can ghi lai du lieu moi
// lan doi font.size.
export function buildShadowLayers(
  shapes: GlyphShape[],
  shadow: Extract<Effect, { type: 'text-shadow' }>,
  fontSize: number,
): ShadowLayer[] {
  // 'drop' la mot WebGL filter (DropShadowFilter, xem buildFilters.ts) —
  // khong phai hinh hoc, khong ve lop nao o day.
  if (shadow.style === 'drop') return [];

  const totalPx = shadow.distance * fontSize;
  const dirX = Math.cos(shadow.angle);
  const dirY = Math.sin(shadow.angle);

  if (shadow.style === 'block' || shadow.style === 'line') {
    return [
      {
        shapes: translateShapes(shapes, dirX * totalPx, dirY * totalPx),
        mode: shadow.style === 'line' ? 'stroke' : 'fill',
      },
    ];
  }

  // '3d': N lop, offset tang dan tu gan (nho) den xa (lon) — nhung TRA VE
  // theo thu tu XA TRUOC GAN SAU, dung thu tu ve (painter's algorithm: ve
  // truoc bi de sau) de lop gan ong khoi nhat nam tren cung trong so cac lop
  // shadow (ban than chu chinh van luon ve sau cung, tren tat ca).
  const steps = shadow.steps ?? DEFAULT_3D_STEPS;
  const layers: ShadowLayer[] = [];
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    layers.push({ shapes: translateShapes(shapes, dirX * totalPx * t, dirY * totalPx * t), mode: 'fill' });
  }
  return layers;
}
