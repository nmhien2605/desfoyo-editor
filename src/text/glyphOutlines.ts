import type { Font, PathCommand } from 'opentype.js';

// Toạ độ phẳng [x0, y0, x1, y1, ...] — cùng dạng Pixi Graphics.poly() nhận,
// nên không phải chuyển đổi ở tầng render.
export type Contour = number[];

export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
}

export interface GlyphOutline {
  advance: number;
  shapes: GlyphShape[];
}

// Bezier được flatten thành polyline ngay tại đây chứ không mang theo dưới
// dạng đường cong, vì warp map từng điểm qua một hàm phi tuyến — map điểm
// điều khiển bezier thay vì điểm đã lấy mẫu sẽ cho ra đường cong sai.
// Bước 2px giữ sai số vồng (sagitta) dưới ~0.13px với mọi cung bán kính >= 4px.
const FLATTEN_STEP_PX = 2;
const MIN_STEPS = 4;
const MAX_STEPS = 32;

function stepsFor(points: Array<[number, number]>): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.ceil(length / FLATTEN_STEP_PX)));
}

function cubic(t: number, a: number, b: number, c: number, d: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function quadratic(t: number, a: number, b: number, c: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

// Diện tích có dấu theo công thức shoelace. Dấu cho biết chiều quay của
// contour — đó là cách phân biệt outer với lỗ mà không cần biết font thuộc
// định dạng nào (TrueType vẽ outer theo chiều kim đồng hồ, CFF/OTF thì ngược lại).
export function signedArea(contour: Contour): number {
  let sum = 0;
  for (let i = 0; i < contour.length; i += 2) {
    const j = (i + 2) % contour.length;
    sum += contour[i] * contour[j + 1] - contour[j] * contour[i + 1];
  }
  return sum / 2;
}

export function translateContour(contour: Contour, dx: number, dy: number): Contour {
  const out = new Array<number>(contour.length);
  for (let i = 0; i < contour.length; i += 2) {
    out[i] = contour[i] + dx;
    out[i + 1] = contour[i + 1] + dy;
  }
  return out;
}

function commandsToContours(commands: PathCommand[]): Contour[] {
  const contours: Contour[] = [];
  let current: Contour = [];
  let x = 0;
  let y = 0;

  const push = (px: number, py: number) => {
    current.push(px, py);
    x = px;
    y = py;
  };

  for (const command of commands) {
    switch (command.type) {
      case 'M':
        if (current.length >= 6) contours.push(current);
        current = [];
        push(command.x, command.y);
        break;
      case 'L':
        push(command.x, command.y);
        break;
      case 'C': {
        const steps = stepsFor([
          [x, y],
          [command.x1, command.y1],
          [command.x2, command.y2],
          [command.x, command.y],
        ]);
        const [x0, y0] = [x, y];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          current.push(
            cubic(t, x0, command.x1, command.x2, command.x),
            cubic(t, y0, command.y1, command.y2, command.y),
          );
        }
        x = command.x;
        y = command.y;
        break;
      }
      case 'Q': {
        const steps = stepsFor([
          [x, y],
          [command.x1, command.y1],
          [command.x, command.y],
        ]);
        const [x0, y0] = [x, y];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          current.push(
            quadratic(t, x0, command.x1, command.x),
            quadratic(t, y0, command.y1, command.y),
          );
        }
        x = command.x;
        y = command.y;
        break;
      }
      case 'Z':
        if (current.length >= 6) contours.push(current);
        current = [];
        break;
    }
  }
  if (current.length >= 6) contours.push(current);
  return contours;
}

// Point-in-polygon kiểu ray casting. Chỉ cần khi một glyph có nhiều outer
// (ví dụ '%', 'ü') để biết lỗ nào thuộc outer nào.
function containsPoint(contour: Contour, px: number, py: number): boolean {
  let inside = false;
  for (let i = 0, j = contour.length - 2; i < contour.length; j = i, i += 2) {
    const xi = contour[i];
    const yi = contour[i + 1];
    const xj = contour[j];
    const yj = contour[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Contour có |diện tích| lớn nhất chắc chắn là một outer. Cùng dấu với nó là
// outer, ngược dấu là lỗ — đúng cho cả TrueType lẫn CFF mà không cần biết
// font thuộc loại nào.
function groupIntoShapes(contours: Contour[]): GlyphShape[] {
  if (contours.length === 0) return [];
  const areas = contours.map(signedArea);
  let largest = 0;
  for (let i = 1; i < areas.length; i++) {
    if (Math.abs(areas[i]) > Math.abs(areas[largest])) largest = i;
  }
  const outerSign = Math.sign(areas[largest]);

  const shapes: GlyphShape[] = [];
  const holes: Contour[] = [];
  contours.forEach((contour, i) => {
    if (Math.sign(areas[i]) === outerSign) shapes.push({ outer: contour, holes: [] });
    else holes.push(contour);
  });

  for (const hole of holes) {
    const owner = shapes.find((shape) => containsPoint(shape.outer, hole[0], hole[1])) ?? shapes[0];
    owner.holes.push(hole);
  }
  return shapes;
}

// Chỉ nơi duy nhất trong codebase đọc glyph outline/path từ opentype.js.
// fontService.ts chỉ parse font file thành Font object, không đụng tới path geometry.
// Đổi sang harfbuzzjs hay fontkit về sau chỉ phải viết lại file này — xem docs/text-future-work.md.
//
// Trả về một phần tử cho mỗi *glyph* chứ không phải mỗi ký tự: khi font có
// ligature, số glyph ít hơn số ký tự. layout.ts vì vậy tự cắt dòng theo '\n'
// trước rồi mới gọi hàm này cho từng dòng, để không phải map ngược glyph về
// ký tự.
export function getGlyphOutlines(text: string, font: Font, fontSize: number): GlyphOutline[] {
  const scale = fontSize / font.unitsPerEm;
  return font.stringToGlyphs(text).map((glyph) => ({
    advance: (glyph.advanceWidth ?? 0) * scale,
    shapes: groupIntoShapes(commandsToContours(glyph.getPath(0, 0, fontSize).commands)),
  }));
}
