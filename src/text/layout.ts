import type { Font } from 'opentype.js';
import { getGlyphOutlines, translateContour, type GlyphShape } from './glyphOutlines';

export interface TextLayout {
  // Đã dịch vào đúng vị trí trong hộp: gốc toạ độ ở góc trên-trái, y xuống.
  shapes: GlyphShape[];
  width: number;
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
    const width =
      glyphs.reduce((sum, glyph) => sum + glyph.advance, 0) +
      Math.max(0, glyphs.length - 1) * letterSpacing;
    return { glyphs, width };
  });

  const width = measured.reduce((max, line) => Math.max(max, line.width), 0);
  const height = ascent + descent + (lines.length - 1) * lineStep;

  const shapes: GlyphShape[] = [];
  measured.forEach((line, lineIndex) => {
    const slack = width - line.width;
    const offsetX = align === 'center' ? slack / 2 : align === 'right' ? slack : 0;
    const baseline = ascent + lineIndex * lineStep;
    let penX = offsetX;
    for (const glyph of line.glyphs) {
      for (const shape of glyph.shapes) {
        shapes.push({
          outer: translateContour(shape.outer, penX, baseline),
          holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
        });
      }
      penX += glyph.advance + letterSpacing;
    }
  });

  return { shapes, width, height, baselineY: ascent };
}
