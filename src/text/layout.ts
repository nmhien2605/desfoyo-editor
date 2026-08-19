import type { Font } from 'opentype.js';
import { getGlyphOutlines, translateContour, type GlyphShape } from './glyphOutlines';

export interface TextLayout {
  // Đã dịch vào đúng vị trí trong hộp: gốc toạ độ ở góc trên-trái, y xuống.
  shapes: GlyphShape[];
  // Cùng độ dài/thứ tự với shapes — x của tâm mực (ink-xMid) của glyph GỐC sinh
  // ra shape đó, dùng làm tâm xoay cho circleWarp (xem circleWarp.ts). Nhiều
  // shape của cùng một font-glyph (chấm+thân 'i') dùng CHUNG một giá trị, để
  // không tách rời nhau khi xoay quanh vòng tròn.
  shapePivotX: number[];
  width: number;
  // Giong width nhung KHONG cong letterSpacing (chi tong advance glyph) — dung
  // lam mau so chuan hoa X cho warp/circle o textGeometry.ts, de letterSpacing
  // chi giai cach ky tu tren path/vong tron, khong lam path/circle to ra.
  advanceWidth: number;
  height: number;
  baselineY: number; // baseline của dòng đầu tiên
}

export interface LayoutOptions {
  text: string;
  font: Font;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number; // bội số của fontSize
  align: 'left' | 'center' | 'right';
}

// Không auto-wrap: chỉ ngắt dòng ở '\n'. Có wrap thì node.size.width phải trở
// thành đầu vào của layout thay vì đầu ra, đảo chiều quan hệ giữa kích thước
// node và nội dung — xem docs/text-future-work.md mục 2.
export function layoutText(options: LayoutOptions): TextLayout {
  const { text, font, fontSize, letterSpacing, lineHeight, align } = options;
  const scale = fontSize / font.unitsPerEm;
  const ascent = font.ascender * scale;
  const descent = -font.descender * scale; // descender là số âm trong font units
  const lineStep = fontSize * lineHeight;
  const lines = text.split('\n');

  const measured = lines.map((line) => {
    const glyphs = getGlyphOutlines(line, font, fontSize);
    const advanceWidth = glyphs.reduce((sum, glyph) => sum + glyph.advance, 0);
    const width = advanceWidth + Math.max(0, glyphs.length - 1) * letterSpacing;
    return { glyphs, width, advanceWidth };
  });

  const width = measured.reduce((max, line) => Math.max(max, line.width), 0);
  const advanceWidth = measured.reduce((max, line) => Math.max(max, line.advanceWidth), 0);
  const height = ascent + descent + (lines.length - 1) * lineStep;

  const shapes: GlyphShape[] = [];
  const shapePivotX: number[] = [];
  measured.forEach((line, lineIndex) => {
    const slack = width - line.width;
    const offsetX = align === 'center' ? slack / 2 : align === 'right' ? slack : 0;
    const baseline = ascent + lineIndex * lineStep;
    let penX = offsetX;
    for (const glyph of line.glyphs) {
      const translated = glyph.shapes.map((shape) => ({
        outer: translateContour(shape.outer, penX, baseline),
        holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
      }));
      // Tâm mực (khong can chinh xac extrema — chi dung lam tam xoay, khong
      // phai bien cat) tinh mot lan tren TOAN BO outer cua glyph, dung chung
      // cho moi shape cua glyph do.
      let minX = Infinity;
      let maxX = -Infinity;
      for (const shape of translated) {
        for (let i = 0; i < shape.outer.length; i += 2) {
          if (shape.outer[i] < minX) minX = shape.outer[i];
          if (shape.outer[i] > maxX) maxX = shape.outer[i];
        }
      }
      const pivotX = (minX + maxX) / 2;
      for (const shape of translated) {
        shapes.push(shape);
        shapePivotX.push(pivotX);
      }
      penX += glyph.advance + letterSpacing;
    }
  });

  return { shapes, shapePivotX, width, advanceWidth, height, baselineY: ascent };
}
