import type { Font } from 'opentype.js';

export interface GlyphPlacement {
  char: string;
  x: number;
  y: number;
}

export interface LayoutOptions {
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
}

// Independent of PIXI.Text/Canvas layout by design (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md "Layout" — Canvas
// never exposes per-glyph positions, so warp needs its own source of truth
// for both geometry and fill, driven by the same opentype.Font metrics
// getPath() will use later). word-wrap breaks on whitespace only (no
// hyphenation) — same scope as PIXI.Text's own wordWrap.
export function layoutGlyphs(
  font: Font,
  content: string,
  fontSize: number,
  boxWidth: number,
  options: LayoutOptions = {},
): GlyphPlacement[] {
  const letterSpacing = options.letterSpacing ?? 0;
  const lineHeight = options.lineHeight ?? ((font.ascender - font.descender) / font.unitsPerEm) * fontSize;
  const scale = fontSize / font.unitsPerEm;

  const words = content.split(/(\s+)/); // keep whitespace tokens for advance
  const lines: string[] = [''];
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = measureWidth(font, word, scale, letterSpacing);
    const isWhitespace = word.trim() === '';
    if (!isWhitespace && wordWidth > boxWidth) {
      // Single word can't fit on any line alone — force-break it character by
      // character (no hyphenation, same as a plain wordWrap fallback).
      if (lineWidth > 0) {
        lines.push('');
        lineWidth = 0;
      }
      for (const char of word) {
        if (lineWidth > boxWidth) {
          lines.push('');
          lineWidth = 0;
        }
        const charWidth = measureWidth(font, char, scale, letterSpacing);
        lines[lines.length - 1] += char;
        lineWidth += charWidth;
      }
      continue;
    }
    if (lineWidth + wordWidth > boxWidth && lineWidth > 0 && !isWhitespace) {
      lines.push('');
      lineWidth = 0;
    }
    lines[lines.length - 1] += word;
    lineWidth += wordWidth;
  }

  const placements: GlyphPlacement[] = [];
  lines.forEach((line, lineIndex) => {
    const lineWidthActual = measureWidth(font, line, scale, letterSpacing);
    const xOffset =
      options.align === 'center' ? (boxWidth - lineWidthActual) / 2 : options.align === 'right' ? boxWidth - lineWidthActual : 0;
    let x = xOffset;
    // Baseline sits one ascender below the box top (matching PIXI.Text's
    // box-top-at-y=0 convention), not at y=0 itself — see finding 1 of the
    // final review: warpMesh.ts's flattenPath does `offsetY - y * scale`
    // (font y-up -> screen y-down), so a y=0 baseline would place every
    // glyph entirely ABOVE the box instead of inside it.
    const y = (font.ascender / font.unitsPerEm) * fontSize + lineIndex * lineHeight;
    for (const char of line) {
      placements.push({ char, x, y });
      const glyph = font.charToGlyph(char);
      x += (glyph.advanceWidth ?? 0) * scale + letterSpacing;
    }
  });
  return placements;
}

function measureWidth(font: Font, text: string, scale: number, letterSpacing: number): number {
  let width = 0;
  for (const char of text) {
    width += (font.charToGlyph(char).advanceWidth ?? 0) * scale + letterSpacing;
  }
  return width - (text.length > 0 ? letterSpacing : 0); // no trailing spacing after the last glyph
}
