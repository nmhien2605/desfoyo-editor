import type { Font, PathCommand } from 'opentype.js';
import { evalCubic, evalD1 } from './bezier';

// Toạ độ phẳng [x0,y0, c1x,c1y,c2x,c2y, x1,y1, ...] — một điểm on-curve mở
// đầu, rồi 3 điểm cho mỗi cung cubic. Độ dài luôn là 2 + 6n, contour luôn
// kín (điểm on-curve cuối trùng điểm đầu).
//
// MỌI cặp số là một điểm 2D, kể cả control point. Nhờ vậy placeOnPath (một
// phép affine) map đồng nhất cả mảng mà không cần biết cặp nào on-curve —
// đó là lý do không còn phải flatten bezier ở đây nữa.
export type Contour = number[];

export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
}

export interface GlyphOutline {
  advance: number;
  shapes: GlyphShape[];
}

// Cầu phương Gauss–Legendre 3 nút trên [0,1].
const GL_T = [0.5 - Math.sqrt(0.6) / 2, 0.5, 0.5 + Math.sqrt(0.6) / 2];
const GL_W = [5 / 18, 4 / 9, 5 / 18];

// Diện tích có dấu theo Green: A = ½∮(x dy − y dx) = ½∫(x·y′ − y·x′)dt.
// Hàm dưới dấu tích phân là đa thức bậc 3+2 = 5; Gauss–Legendre n nút chính
// xác đến bậc 2n−1, nên 3 nút cho kết quả ĐÚNG TUYỆT ĐỐI, không phải xấp xỉ.
//
// Dấu cho biết chiều quay của contour — đó là cách phân biệt outer với lỗ mà
// không cần biết font thuộc định dạng nào (TrueType vẽ outer theo chiều kim
// đồng hồ, CFF/OTF thì ngược lại).
export function signedArea(contour: Contour): number {
  let sum = 0;
  for (let i = 0; i + 7 < contour.length; i += 6) {
    const x0 = contour[i];
    const y0 = contour[i + 1];
    const x1 = contour[i + 2];
    const y1 = contour[i + 3];
    const x2 = contour[i + 4];
    const y2 = contour[i + 5];
    const x3 = contour[i + 6];
    const y3 = contour[i + 7];
    for (let g = 0; g < 3; g++) {
      const t = GL_T[g];
      sum +=
        GL_W[g] *
        (evalCubic(x0, x1, x2, x3, t) * evalD1(y0, y1, y2, y3, t) -
          evalCubic(y0, y1, y2, y3, t) * evalD1(x0, x1, x2, x3, t));
    }
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
  let startX = 0;
  let startY = 0;

  const curve = (c1x: number, c1y: number, c2x: number, c2y: number, px: number, py: number) => {
    current.push(c1x, c1y, c2x, c2y, px, py);
    x = px;
    y = py;
  };
  // Đoạn thẳng biểu diễn chính xác bằng cubic với control point chia đều.
  const line = (px: number, py: number) =>
    curve(
      x + (px - x) / 3,
      y + (py - y) / 3,
      x + (2 * (px - x)) / 3,
      y + (2 * (py - y)) / 3,
      px,
      py,
    );

  const finish = () => {
    // 2 + 6·1 = 8: cần ít nhất một cung mới thành contour.
    if (current.length >= 8) {
      if (x !== startX || y !== startY) line(startX, startY);
      contours.push(current);
    }
    current = [];
  };

  for (const command of commands) {
    switch (command.type) {
      case 'M':
        finish();
        current = [command.x, command.y];
        x = startX = command.x;
        y = startY = command.y;
        break;
      case 'L':
        line(command.x, command.y);
        break;
      case 'C':
        curve(command.x1, command.y1, command.x2, command.y2, command.x, command.y);
        break;
      case 'Q':
        // Nâng bậc quadratic -> cubic, chính xác tuyệt đối (TrueType dùng Q).
        curve(
          x + (2 / 3) * (command.x1 - x),
          y + (2 / 3) * (command.y1 - y),
          command.x + (2 / 3) * (command.x1 - command.x),
          command.y + (2 / 3) * (command.y1 - command.y),
          command.x,
          command.y,
        );
        break;
      case 'Z':
        finish();
        break;
    }
  }
  finish();
  return contours;
}

// Point-in-polygon kiểu ray casting trên các điểm on-curve. Chỉ cần khi một
// glyph có nhiều outer (ví dụ '%', 'ü') để biết lỗ nào thuộc outer nào.
//
// Trần đã biết: bỏ qua phần phình của cung so với dây cung, nên sai nếu điểm
// đầu của một lỗ rơi đúng vào khe giữa cung và dây cung của outer khác. Chưa
// gặp với font Latin — xem docs/text-future-work.md.
export function containsPoint(contour: Contour, px: number, py: number): boolean {
  let inside = false;
  const count = (contour.length - 2) / 6;
  for (let s = 0; s < count; s++) {
    const i = s * 6;
    const j = ((s + count - 1) % count) * 6;
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
  const glyphs = font.stringToGlyphs(text);
  const outlines = glyphs.map((glyph) => {
    const advance = (glyph.advanceWidth ?? 0) * scale;
    return {
      advance,
      shapes: groupIntoShapes(commandsToContours(glyph.getPath(0, 0, fontSize).commands)),
    };
  });
  // GPOS/kern cho từng cặp liền kề — cộng thêm vào advance của glyph đứng
  // trước trong cặp, vì pen chỉ tiến sau khi đã "qua" glyph đó. Chỉ cộng dồn,
  // không đụng tới shapes/outer/hole ở trên.
  for (let i = 0; i < glyphs.length - 1; i++) {
    const kern = font.getKerningValue(glyphs[i], glyphs[i + 1]);
    if (kern) outlines[i].advance += kern * scale;
  }
  return outlines;
}
