import { extrema, splitCubic, type Cubic } from './bezier';
import { translateContour, type Contour, type GlyphShape } from './glyphOutlines';
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

  // '3d': khoi dac dung ribbon (Minkowski sum) thay vi N ban sao roi rac —
  // lop day (far cap, giong het 'block') roi lop thanh (wall) noi day voi
  // chu chinh, khong co khe ho o bat ky distance nao.
  if (totalPx === 0) return [];
  return [
    { shapes: translateShapes(shapes, dirX * totalPx, dirY * totalPx), mode: 'fill' },
    { shapes: buildRibbonShapes(shapes, dirX * totalPx, dirY * totalPx), mode: 'fill' },
  ];
}

// Lop thanh (wall) cua 3D shadow: voi moi doan cubic cua moi contour (outer +
// holes), sinh 1 GlyphShape la dai hinh quet boi doan do khi tinh tien
// (dx,dy). Tach truoc tai diem tiep tuyen song song (dx,dy) (splitAtTangentParallel)
// de tranh ribbon dang "no" tu triet tieu duoi SVG nonzero winding, va chuan
// hoa chieu (ribbonContour) de moi ribbon cung dau dien tich — hai lop nay la
// bat buoc, khong phai toi uu: thieu di se thung lo khi export SVG.
export function buildRibbonShapes(shapes: GlyphShape[], dx: number, dy: number): GlyphShape[] {
  const result: GlyphShape[] = [];
  const processContour = (contour: Contour) => {
    const n = (contour.length - 2) / 6;
    for (let s = 0; s < n; s++) {
      const i = s * 6;
      const X: Cubic = [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]];
      const Y: Cubic = [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]];
      for (const [sx, sy] of splitAtTangentParallel(X, Y, dx, dy)) {
        const cross = (sx[3] - sx[0]) * dy - (sy[3] - sy[0]) * dx;
        if (Math.abs(cross) < 1e-9) continue; // suy bien (tiep tuyen ~ song song d), dien tich ~0
        result.push({ outer: ribbonContour(sx, sy, dx, dy), holes: [] });
      }
    }
  };
  for (const shape of shapes) {
    processContour(shape.outer);
    for (const hole of shape.holes) processContour(hole);
  }
  return result;
}

// Chuan hoa chieu: dien tich co dau cua ribbon ti le voi cross(P3-P0, d) —
// doi dau tuy doan cong nam phia nao cua contour. Neu cross<0, dung ribbon
// bat dau tu phia da tinh tien thay vi phia goc (doi vai tro goc/tinh tien)
// de moi ribbon luon co dien tich cung dau — thieu buoc nay se thung lo khi
// SVG gop nhieu ribbon vao 1 <path fill-rule="nonzero">.
function ribbonContour(X: Cubic, Y: Cubic, dx: number, dy: number): Contour {
  const cross = (X[3] - X[0]) * dy - (Y[3] - Y[0]) * dx;
  const [p0x, c1x, c2x, p3x] = X;
  const [p0y, c1y, c2y, p3y] = Y;
  if (cross >= 0) {
    return [
      p0x, p0y,
      c1x, c1y, c2x, c2y, p3x, p3y,
      p3x, p3y, p3x + dx, p3y + dy, p3x + dx, p3y + dy,
      c2x + dx, c2y + dy, c1x + dx, c1y + dy, p0x + dx, p0y + dy,
      p0x + dx, p0y + dy, p0x, p0y, p0x, p0y,
    ];
  }
  return [
    p0x + dx, p0y + dy,
    c1x + dx, c1y + dy, c2x + dx, c2y + dy, p3x + dx, p3y + dy,
    p3x + dx, p3y + dy, p3x, p3y, p3x, p3y,
    c2x, c2y, c1x, c1y, p0x, p0y,
    p0x, p0y, p0x + dx, p0y + dy, p0x + dx, p0y + dy,
  ];
}

// Diem tach = nghiem cross(f'(t), d) = 0, dung bang extrema(w0..w3) voi
// w_i = x_i*dy - y_i*dx (dao ham cua cross theo t la cross(f'(t),d), dang da
// thuc bac 2 giong extrema da xu ly cho bbox). Tai dung extrema/splitCubic tu
// bezier.ts, khong viet toan moi.
function splitAtTangentParallel(X: Cubic, Y: Cubic, dx: number, dy: number): Array<[Cubic, Cubic]> {
  const w: Cubic = [X[0] * dy - Y[0] * dx, X[1] * dy - Y[1] * dx, X[2] * dy - Y[2] * dx, X[3] * dy - Y[3] * dx];
  const roots = extrema(w[0], w[1], w[2], w[3]).sort((a, b) => a - b);
  if (roots.length === 0) return [[X, Y]];

  const pieces: Array<[Cubic, Cubic]> = [];
  let curX = X;
  let curY = Y;
  let prevT = 0;
  for (const t of roots) {
    const localT = (t - prevT) / (1 - prevT);
    const sx = splitCubic(curX[0], curX[1], curX[2], curX[3], localT);
    const sy = splitCubic(curY[0], curY[1], curY[2], curY[3], localT);
    pieces.push([sx.left, sy.left]);
    curX = sx.right;
    curY = sy.right;
    prevT = t;
  }
  pieces.push([curX, curY]);
  return pieces;
}
