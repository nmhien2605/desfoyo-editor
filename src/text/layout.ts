import type { Font } from 'opentype.js';
import {
  FAUX_ITALIC_SKEW,
  getGlyphOutlines,
  signedArea,
  translateContour,
  type Contour,
  type FauxStyle,
  type GlyphShape,
} from './glyphOutlines';

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
  // Trung điểm hộp ascent/descent của DÒNG ĐẦU — pivot xoay dọc cho Custom
  // (customWarp.ts), khác baselineY vì Custom neo tâm dọc của chữ, không neo
  // chân chữ như warp/circle. Một giá trị cho cả dòng (không tính riêng bbox
  // từng glyph) để chữ có dấu xuống dưới (g/y/p) không lệch tâm so với chữ
  // khác trên cùng path.
  centerY: number;
}

export interface LayoutOptions {
  text: string;
  font: Font;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number; // bội số của fontSize
  align: 'left' | 'center' | 'right' | 'justify';
  faux?: FauxStyle; // bold/italic giả khi không có file biến thể (glyphOutlines.ts)
  underline?: boolean;
}

// Fallback khi font không có bảng post (hoặc thickness = 0): giá trị em gần
// với đa số font Latin.
const UNDERLINE_FALLBACK = { position: -0.1, thickness: 0.05 };

// Gạch chân (px, y xuống, tính từ baseline): top/bottom của dải. post.
// underlinePosition là toạ độ ĐỈNH của dải theo spec OpenType (âm = dưới baseline).
export function underlineMetrics(font: Font, fontSize: number): { top: number; bottom: number } {
  const post = font.tables.post as { underlinePosition?: number; underlineThickness?: number } | undefined;
  const em = font.unitsPerEm;
  const ok = post && typeof post.underlinePosition === 'number' && (post.underlineThickness ?? 0) > 0;
  const position = ok ? post.underlinePosition! / em : UNDERLINE_FALLBACK.position;
  const thickness = ok ? post.underlineThickness! / em : UNDERLINE_FALLBACK.thickness;
  const top = -position * fontSize;
  return { top, bottom: top + thickness * fontSize };
}

// Hình chữ nhật dạng cubic (control point chia đều — đoạn thẳng chính xác như
// commandsToContours). `sign` = chiều quay của outer glyph, để dưới fill-rule
// nonzero (svgSerializer) dải không triệt tiêu chỗ chồng lên chân chữ g/y/p.
function rectContour(x0: number, y0: number, x1: number, y1: number, sign: number): Contour {
  const pts = [x0, y0, x1, y0, x1, y1, x0, y1];
  const c: Contour = [x0, y0];
  for (let k = 1; k <= 4; k++) {
    const ax = pts[(k - 1) * 2];
    const ay = pts[(k - 1) * 2 + 1];
    const bx = pts[(k % 4) * 2];
    const by = pts[(k % 4) * 2 + 1];
    c.push(ax + (bx - ax) / 3, ay + (by - ay) / 3, ax + (2 * (bx - ax)) / 3, ay + (2 * (by - ay)) / 3, bx, by);
  }
  if (Math.sign(signedArea(c)) === sign) return c;
  return rectContour(x1, y0, x0, y1, sign);
}

// Không auto-wrap: chỉ ngắt dòng ở '\n'. Có wrap thì node.size.width phải trở
// thành đầu vào của layout thay vì đầu ra, đảo chiều quan hệ giữa kích thước
// node và nội dung — xem docs/text-future-work.md mục 2.
export function layoutText(options: LayoutOptions): TextLayout {
  const { text, font, fontSize, letterSpacing, lineHeight, align, faux, underline } = options;
  const scale = fontSize / font.unitsPerEm;
  const ascent = font.ascender * scale;
  const descent = -font.descender * scale; // descender là số âm trong font units
  const lineStep = fontSize * lineHeight;
  const lines = text.split('\n');
  // Faux italic nhô sang phải tối đa cả chiều cao dòng × tan — cộng vào width
  // (không vào advanceWidth: đó là tổng advance thuần cho warp) để khung không cắt mực.
  const italicOverhang = faux?.italic ? (ascent + descent) * FAUX_ITALIC_SKEW : 0;

  const measured = lines.map((line) => {
    const glyphs = getGlyphOutlines(line, font, fontSize, faux);
    const advanceWidth = glyphs.reduce((sum, glyph) => sum + glyph.advance, 0);
    const width =
      advanceWidth + Math.max(0, glyphs.length - 1) * letterSpacing + (glyphs.length > 0 ? italicOverhang : 0);
    return { glyphs, width, advanceWidth };
  });

  const width = measured.reduce((max, line) => Math.max(max, line.width), 0);
  const advanceWidth = measured.reduce((max, line) => Math.max(max, line.advanceWidth), 0);
  const height = ascent + descent + (lines.length - 1) * lineStep;

  const shapes: GlyphShape[] = [];
  const shapePivotX: number[] = [];
  const under = underline ? underlineMetrics(font, fontSize) : null;
  const firstOuter = measured.flatMap((line) => line.glyphs).find((g) => g.shapes.length > 0)?.shapes[0].outer;
  const outerSign = (firstOuter && Math.sign(signedArea(firstOuter))) || 1;
  measured.forEach((line, lineIndex) => {
    const slack = width - line.width;
    const offsetX = align === 'center' ? slack / 2 : align === 'right' ? slack : 0;
    const baseline = ascent + lineIndex * lineStep;
    // Justify không wrap: dãn mọi dòng trừ dòng cuối tới width (dòng rộng
    // nhất) bằng cách chia đều slack cho các khoảng trắng GIỮA hai từ; dòng
    // cuối / dòng một từ giữ căn trái.
    const first = line.glyphs.findIndex((g) => !g.space);
    let last = line.glyphs.length - 1;
    while (last >= 0 && line.glyphs[last].space) last--;
    const isGap = (i: number) => line.glyphs[i].space && i > first && i < last;
    const gaps =
      align === 'justify' && lineIndex < measured.length - 1 ? line.glyphs.filter((_, i) => isGap(i)).length : 0;
    const gapExtra = gaps > 0 ? slack / gaps : 0;
    let penX = offsetX;
    line.glyphs.forEach((glyph, glyphIndex) => {
      const advance = glyph.advance + (gapExtra && isGap(glyphIndex) ? gapExtra : 0);
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
      // Gạch chân cắt theo từng glyph (phủ cả letterSpacing tới glyph kế, trừ
      // glyph cuối) và dùng chung pivot của glyph: warp family uốn được theo
      // từng đoạn, còn circle/custom (xoay cứng từng glyph) kéo đoạn đi theo
      // glyph của nó. Không vượt quá line.width nên không đổi width.
      if (under) {
        const isLast = glyphIndex === line.glyphs.length - 1;
        const x1 = penX + advance + (isLast ? 0 : letterSpacing);
        if (x1 > penX) {
          shapes.push({ outer: rectContour(penX, baseline + under.top, x1, baseline + under.bottom, outerSign), holes: [] });
          shapePivotX.push(Number.isFinite(pivotX) ? pivotX : (penX + x1) / 2);
        }
      }
      penX += advance + letterSpacing;
    });
  });

  return { shapes, shapePivotX, width, advanceWidth, height, baselineY: ascent, centerY: (ascent + descent) / 2 };
}
