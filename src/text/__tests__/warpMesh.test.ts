import { describe, it, expect } from 'vitest';
import * as opentype from 'opentype.js';
import { buildWarpedGlyphGeometry } from '../warpMesh';
import { layoutGlyphs } from '../layoutGlyphs';

// 'o' needs a real hole (outer + inner contour) to exercise earcut's holes
// path; 'l' is a single simple contour (rectangle).
function buildFixtureFont(): opentype.Font {
  const outer = new opentype.Path();
  outer.moveTo(0, 0); outer.lineTo(600, 0); outer.lineTo(600, 700); outer.lineTo(0, 700); outer.close();
  const inner = new opentype.Path();
  inner.moveTo(150, 150); inner.lineTo(150, 550); inner.lineTo(450, 550); inner.lineTo(450, 150); inner.close();
  const oPath = new opentype.Path();
  oPath.commands = [...outer.commands, ...inner.commands];

  const lPath = new opentype.Path();
  lPath.moveTo(0, 0); lPath.lineTo(200, 0); lPath.lineTo(200, 700); lPath.lineTo(0, 700); lPath.close();

  const notdef = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 0, path: new opentype.Path() });
  const oGlyph = new opentype.Glyph({ name: 'o', unicode: 111, advanceWidth: 600, path: oPath });
  const lGlyph = new opentype.Glyph({ name: 'l', unicode: 108, advanceWidth: 200, path: lPath });
  return new opentype.Font({ familyName: 'Fixture', styleName: 'Regular', unitsPerEm: 1000, ascender: 800, descender: -200, glyphs: [notdef, oGlyph, lGlyph] });
}

describe('buildWarpedGlyphGeometry', () => {
  it('produces valid geometry (non-empty, indices in range) for a glyph with a hole', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'o', 100, 1000);
    const noWarp = { type: 'arch' as const, curve: 0 };
    const geom = buildWarpedGlyphGeometry(font, placements, 100, noWarp, 1000, 100);
    expect(geom.positions.length).toBeGreaterThan(0);
    expect(geom.positions.length % 2).toBe(0);
    expect(geom.indices.length % 3).toBe(0);
    const maxIndex = geom.positions.length / 2 - 1;
    for (const idx of geom.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });

  it('produces valid geometry for a glyph without a hole', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const noWarp = { type: 'arch' as const, curve: 0 };
    const geom = buildWarpedGlyphGeometry(font, placements, 100, noWarp, 1000, 100);
    expect(geom.positions.length).toBeGreaterThan(0);
    expect(geom.indices.length).toBeGreaterThan(0);
  });

  it('applies the warp displacement to vertex positions (curve=0 is a documented no-op for arch, so use rise instead)', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const flat = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 0 }, 1000, 100);
    const risen = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 1 }, 1000, 100);
    expect(flat.positions).not.toEqual(risen.positions);
  });

  it('gradientUvs carry the pre-warp position, unaffected by the warp applied to positions', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const flat = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 0 }, 1000, 100);
    const risen = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 1 }, 1000, 100);
    expect(flat.gradientUvs).toEqual(risen.gradientUvs);
  });
});
