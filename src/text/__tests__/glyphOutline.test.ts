import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import * as opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { layoutText } from '../glyphOutline';
import type { TextNode } from '../../schema';

// Roboto-Black.ttf, OFL-licensed, borrowed from opentype.js's own test
// fixtures (opentypejs/opentype.js test/fonts) — small, static (not
// variable), has a real kern table so the "AV" kerning assertion below is
// meaningful rather than trivially zero.
const here = dirname(fileURLToPath(import.meta.url));

function parseFixture(filename: string): opentype.Font {
  const buffer = readFileSync(join(here, 'fixtures', filename));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

const font = parseFixture('Roboto-Black.ttf');

// PlayfairDisplay[wght].ttf, OFL-licensed, fetched from the exact google/fonts
// commit SHA fontService.ts pins to (see plan/phases/phase-3-glyph-outline-
// opentype.md §1) — bundled here because opentype.js's parsing of this real
// variable font produces NaN control points for the 'y' glyph specifically
// (found by exercising the live dev server's Export SVG against Playfair
// Display text, not something a synthetic mock reproduces faithfully: the
// corruption comes from Path.toPathData's internal optimizeCommands curve-
// merging math on degenerate gvar-delta points, not from a directly-NaN
// coordinate a mock could just inject).
const variableFont = parseFixture('PlayfairDisplay-Variable.ttf');

const baseFont = { family: 'Roboto', weight: 900, style: 'normal' as const, size: 24 };
const baseFields = { opacity: 1, visible: true, locked: false };
const baseTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };

function textNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-1',
    type: 'text',
    transform: { ...baseTransform },
    size: { width: 400, height: 100 },
    ...baseFields,
    text: 'AV',
    font: { ...baseFont },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
    ...overrides,
  };
}

describe('layoutText', () => {
  it('places two glyphs for "AV", the second offset by the first\'s advance plus kerning', () => {
    const layout = layoutText(textNode({ text: 'AV' }), font);
    expect(layout).toBeDefined();
    const glyphs = layout!.lines[0].glyphs;
    expect(glyphs).toHaveLength(2);

    const scale = baseFont.size / font.unitsPerEm;
    const glyphA = font.charToGlyph('A');
    const glyphV = font.charToGlyph('V');
    const expectedAdvance = (glyphA.advanceWidth ?? 0) * scale;
    const expectedKerning = font.getKerningValue(glyphA, glyphV) * scale;

    expect(glyphs[0].x).toBe(0);
    expect(glyphs[1].x).toBeCloseTo(expectedAdvance + expectedKerning, 5);
  });

  it('returns undefined for text outside the supported script range', () => {
    const layout = layoutText(textNode({ text: 'こんにちは' }), font);
    expect(layout).toBeUndefined();
  });

  it('wraps at a word boundary when a line exceeds node.size.width', () => {
    const node = textNode({ text: 'AV AV AV AV AV AV AV AV AV AV', size: { width: 80, height: 200 } });
    const layout = layoutText(node, font);
    expect(layout).toBeDefined();
    expect(layout!.lines.length).toBeGreaterThan(1);
    layout!.lines.forEach((line) => {
      const lineWidth = line.glyphs.reduce((max, g) => Math.max(max, g.x + g.advance), 0);
      expect(lineWidth).toBeLessThanOrEqual(node.size.width + 1e-6);
    });
  });

  it('caches layout for an unchanged node (same reference returned)', () => {
    const node = textNode();
    const first = layoutText(node, font);
    const second = layoutText(node, font);
    expect(second).toBe(first);
  });

  // Regression coverage for two failure modes found by exercising real fonts
  // fetched from google/fonts against the live dev server (Pass B smoke
  // check): opentype.js 2.0.0 can throw on ordinary Latin text for GSUB
  // lookup formats it doesn't implement (observed on Inter/Roboto's variable
  // font builds — "substitutionType : 62 lookupType: 6 - substFormat: 2 is
  // not yet supported"), and variable-font glyf/gvar parsing can silently
  // produce NaN control points for specific glyphs (observed on Playfair
  // Display's 'y'). Both must degrade to undefined (raster fallback), never
  // throw or return a layout with broken path data. Reproduced here by
  // wrapping the real fixture font rather than depending on network access.

  it('returns undefined instead of throwing when font.stringToGlyphs throws', () => {
    const throwingFont = Object.create(font, {
      stringToGlyphs: {
        value: () => {
          throw new Error('substitutionType : 62 lookupType: 6 - substFormat: 2 is not yet supported');
        },
      },
    });
    expect(() => layoutText(textNode({ text: 'Throws' }), throwingFont)).not.toThrow();
    expect(layoutText(textNode({ text: 'Throws' }), throwingFont)).toBeUndefined();
  });

  it('returns undefined instead of a corrupted layout for a real variable-font glyph that outlines to NaN', () => {
    // "Desfoyo Editor" contains the "y" glyph that reproduces the real
    // corruption. A word without it (e.g. "Editor" alone) is the negative
    // control confirming the guard isn't just rejecting every variable font.
    const broken = textNode({ text: 'Desfoyo Editor', font: { family: 'Playfair Display', weight: 700, style: 'normal', size: 40 } });
    expect(() => layoutText(broken, variableFont)).not.toThrow();
    expect(layoutText(broken, variableFont)).toBeUndefined();

    const clean = textNode({ text: 'Editor', font: { family: 'Playfair Display', weight: 700, style: 'normal', size: 40 } });
    expect(layoutText(clean, variableFont)).toBeDefined();
  });
});
