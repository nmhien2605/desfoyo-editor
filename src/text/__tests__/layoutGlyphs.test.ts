import { describe, it, expect } from 'vitest';
import * as opentype from 'opentype.js';
import { layoutGlyphs } from '../layoutGlyphs';

// A minimal 2-glyph font (".notdef" + "A") with known advance widths, built
// the same way opentype.js's own test suite constructs fixture fonts.
function buildFixtureFont(): opentype.Font {
  const notdefGlyph = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 0, path: new opentype.Path() });
  const aGlyph = new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 600, path: new opentype.Path() });
  return new opentype.Font({
    familyName: 'Fixture',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [notdefGlyph, aGlyph],
  });
}

describe('layoutGlyphs', () => {
  it('places glyphs left-to-right using the font advance width, scaled to fontSize', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'AA', 100, 1000);
    expect(placements).toHaveLength(2);
    expect(placements[0].x).toBe(0);
    // advanceWidth 600 / unitsPerEm 1000 * fontSize 100 = 60
    expect(placements[1].x).toBeCloseTo(60, 5);
  });

  it('wraps to a new line when advance would exceed boxWidth', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'AAA', 100, 100); // each 'A' is 60 wide, box is 100
    expect(placements[0].y).toBe(placements[1].y);
    expect(placements[2].y).toBeGreaterThan(placements[1].y);
  });

  it('applies letterSpacing as extra advance between glyphs', () => {
    const font = buildFixtureFont();
    const withSpacing = layoutGlyphs(font, 'AA', 100, 1000, { letterSpacing: 10 });
    const withoutSpacing = layoutGlyphs(font, 'AA', 100, 1000);
    expect(withSpacing[1].x).toBeCloseTo(withoutSpacing[1].x + 10, 5);
  });
});
