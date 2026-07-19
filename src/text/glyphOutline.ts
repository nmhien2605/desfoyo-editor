import type { Font, Glyph, Path } from 'opentype.js';
import type { TextNode } from '../schema';

// Pure module — no Pixi import, so it's testable in plain Node (see
// plan/phases/phase-3-glyph-outline-opentype.md §Pass A). fontService.ts
// stays the only place that touches the DOM/fetch/FontFace.

export interface GlyphPlacement {
  path: Path;
  x: number;
  y: number;
  advance: number;
}

export interface TextLine {
  glyphs: GlyphPlacement[];
}

export interface TextLayout {
  lines: TextLine[];
  bbox: { x: number; y: number; width: number; height: number };
}

// Basic Latin + Latin-1 Supplement + General Punctuation. opentype.js has no
// real shaping engine (no GSUB contextual alternates, no complex-script
// support — see plan doc §Pass A) — text outside this range is forced to the
// raster-fallback path rather than risk silently wrong glyph shapes.
const SUPPORTED_SCRIPT = /^[\n\u0020-\u00ff\u2000-\u206f]*$/;

function isSupportedScript(text: string): boolean {
  return SUPPORTED_SCRIPT.test(text);
}

// Same field shape as textRenderer.ts's rasterizationKey (text, font, align,
// letterSpacing, lineHeight, fill, stroke) — deliberately reimplemented here
// rather than imported, since textRenderer.ts pulls in pixi.js and this
// module must stay Pixi-free. See plan doc §Pass A.
function contentKey(node: TextNode): string {
  return JSON.stringify({
    text: node.text,
    font: node.font,
    align: node.align,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    size: node.size,
  });
}

const layoutCache = new Map<string, TextLayout | undefined>();

// Advance-width-only measurement (no Glyph.getPath call) — used for both
// word-wrap decisions and the natural-width pass that alignment is computed
// against, so we never build throwaway Path objects just to discard them.
function measureWidth(font: Font, text: string, fontSize: number, letterSpacing: number): number {
  const glyphs = font.stringToGlyphs(text);
  const scale = fontSize / font.unitsPerEm;
  let width = 0;
  glyphs.forEach((glyph, i) => {
    if (i > 0) width += font.getKerningValue(glyphs[i - 1], glyph) * scale;
    width += (glyph.advanceWidth ?? 0) * scale + letterSpacing;
  });
  return width;
}

// Greedy word-wrap against node.size.width, using opentype advance widths —
// not byte-identical to PIXI.TextMetrics's Canvas 2D measurement at every
// wrap boundary (two different measurement sources), which is why Pass B
// cross-checks the result against PIXI.TextMetrics before trusting it for
// export. A single word wider than the box stays on its own line rather than
// being character-split.
function wrapParagraph(font: Font, paragraph: string, fontSize: number, letterSpacing: number, maxWidth: number): string[] {
  const words = paragraph.split(/ +/).filter((w) => w.length > 0);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = words[0];
  let currentWidth = measureWidth(font, current, fontSize, letterSpacing);
  const spaceWidth = measureWidth(font, ' ', fontSize, letterSpacing);

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = measureWidth(font, word, fontSize, letterSpacing);
    if (currentWidth + spaceWidth + width <= maxWidth) {
      current += ` ${word}`;
      currentWidth += spaceWidth + width;
    } else {
      lines.push(current);
      current = word;
      currentWidth = width;
    }
  }
  lines.push(current);
  return lines;
}

function wrapText(font: Font, text: string, fontSize: number, letterSpacing: number, maxWidth: number): string[] {
  return text.split('\n').flatMap((paragraph) => wrapParagraph(font, paragraph, fontSize, letterSpacing, maxWidth));
}

// Builds glyph paths for one line's words, starting at `startX` and spacing
// words apart by `gap` — the caller has already decided both from the
// line's natural (unaligned) width, so this is the only place glyph.getPath
// actually runs per line (no separate "layout then shift" pass).
function placeLineGlyphs(font: Font, words: string[], fontSize: number, letterSpacing: number, y: number, startX: number, gap: number): GlyphPlacement[] {
  const scale = fontSize / font.unitsPerEm;
  const glyphs: GlyphPlacement[] = [];
  let x = startX;

  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) x += gap;
    const wordGlyphs = font.stringToGlyphs(word);
    wordGlyphs.forEach((glyph: Glyph, i: number) => {
      if (i > 0) x += font.getKerningValue(wordGlyphs[i - 1], glyph) * scale;
      const path = glyph.getPath(x, y, fontSize);
      const advance = (glyph.advanceWidth ?? 0) * scale + letterSpacing;
      glyphs.push({ path, x, y, advance });
      x += advance;
    });
  });

  return glyphs;
}

// opentype.js's glyph-shaping calls (stringToGlyphs/getKerningValue/getPath)
// aren't as battle-tested as a real shaping engine — verified against real
// fonts fetched from google/fonts, `stringToGlyphs` can throw outright for
// GSUB lookup formats it doesn't implement (seen on Inter's variable font,
// triggered by ordinary multi-character text), and variable-font glyf/gvar
// parsing can silently produce NaN control points for specific glyphs (seen
// on Playfair Display's 'y'). Both are treated the same way as an
// unsupported script or an unparseable font: raster fallback, never a thrown
// error or a corrupted path emitted into an SVG.
function isFiniteLayout(layout: TextLayout): boolean {
  return layout.lines.every((line) =>
    line.glyphs.every((g) => Number.isFinite(g.x) && Number.isFinite(g.y) && !g.path.toPathData(2).includes('NaN')),
  );
}

export function layoutText(node: TextNode, font: Font): TextLayout | undefined {
  if (!isSupportedScript(node.text)) return undefined;

  const key = contentKey(node);
  if (layoutCache.has(key)) return layoutCache.get(key);

  let layout: TextLayout | undefined;
  try {
    const computed = computeLayout(node, font);
    layout = isFiniteLayout(computed) ? computed : undefined;
  } catch {
    layout = undefined;
  }

  layoutCache.set(key, layout);
  return layout;
}

function computeLayout(node: TextNode, font: Font): TextLayout {
  const fontSize = node.font.size;
  const scale = fontSize / font.unitsPerEm;
  const ascent = font.ascender * scale;
  const lineHeightPx = fontSize * node.lineHeight;
  const spaceWidth = measureWidth(font, ' ', fontSize, node.letterSpacing);

  const rawLines = wrapText(font, node.text, fontSize, node.letterSpacing, node.size.width);
  let maxLineWidth = 0;

  const lines: TextLine[] = rawLines.map((lineText, lineIndex) => {
    const y = ascent + lineIndex * lineHeightPx;
    const words = lineText.split(/ +/).filter((w) => w.length > 0);
    if (words.length === 0) return { glyphs: [] };

    const wordWidths = words.map((w) => measureWidth(font, w, fontSize, node.letterSpacing));
    const wordsOnlyWidth = wordWidths.reduce((a, b) => a + b, 0);
    const naturalWidth = wordsOnlyWidth + spaceWidth * (words.length - 1);

    let startX = 0;
    let gap = spaceWidth;
    if (node.align === 'center') {
      startX = (node.size.width - naturalWidth) / 2;
    } else if (node.align === 'right') {
      startX = node.size.width - naturalWidth;
    } else if (node.align === 'justify' && words.length > 1) {
      gap = (node.size.width - wordsOnlyWidth) / (words.length - 1);
    }

    const glyphs = placeLineGlyphs(font, words, fontSize, node.letterSpacing, y, startX, gap);
    const lineWidth = node.align === 'justify' && words.length > 1 ? node.size.width : naturalWidth;
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
    return { glyphs };
  });

  const bbox = { x: 0, y: 0, width: maxLineWidth, height: rawLines.length * lineHeightPx };
  return { lines, bbox };
}
