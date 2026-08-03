import { earcut } from 'pixi.js';
import type { Font, PathCommand } from 'opentype.js';
import type { GlyphPlacement } from './layoutGlyphs';
import { warpDisplacement, type Warp } from './warpFormulas';

const BEZIER_SEGMENTS = 10; // fixed sampling — see Global Constraints, no adaptive subdivision in this slice

interface Contour {
  points: number[]; // flat [x0, y0, x1, y1, ...]
}

// Flattens an opentype Path's command list (M/L/C/Q/Z) into polygon contours
// — one per M...Z run. Multiple contours per glyph are normal (e.g. 'i''s
// dot is a second contour; 'o''s inner ring is a second contour used as an
// earcut hole below).
//
// Takes RAW glyph.path.commands (unscaled font units, y-up) — not
// glyph.getPath()'s output. glyph.getPath(x, y, fontSize) already applies
// both the fontSize/unitsPerEm scale AND the y-up -> y-down flip itself
// (opentype.js negates y internally so glyphs draw right-side up on a
// canvas). Feeding that already-flipped output back through this
// function's own `offsetY - y * scale` flip would flip it a second time,
// rendering every glyph upside down. So this function owns the single
// scale+flip step, and callers must pass the raw, untransformed commands.
function flattenPath(commands: PathCommand[], offsetX: number, offsetY: number, scale: number): Contour[] {
  const contours: Contour[] = [];
  let current: number[] = [];
  let cursor = { x: 0, y: 0 };
  const toWorld = (x: number, y: number) => [offsetX + x * scale, offsetY - y * scale] as const; // font y-up -> screen y-down

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        if (current.length) contours.push({ points: current });
        current = [];
        cursor = { x: cmd.x, y: cmd.y };
        current.push(...toWorld(cmd.x, cmd.y));
        break;
      case 'L':
        cursor = { x: cmd.x, y: cmd.y };
        current.push(...toWorld(cmd.x, cmd.y));
        break;
      case 'C':
        for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
          const t = i / BEZIER_SEGMENTS;
          const p = cubicPoint(cursor, { x: cmd.x1, y: cmd.y1 }, { x: cmd.x2, y: cmd.y2 }, { x: cmd.x, y: cmd.y }, t);
          current.push(...toWorld(p.x, p.y));
        }
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case 'Q':
        for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
          const t = i / BEZIER_SEGMENTS;
          const p = quadPoint(cursor, { x: cmd.x1, y: cmd.y1 }, { x: cmd.x, y: cmd.y }, t);
          current.push(...toWorld(p.x, p.y));
        }
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case 'Z':
        if (current.length) contours.push({ points: current });
        current = [];
        break;
    }
  }
  if (current.length) contours.push({ points: current });
  return contours;
}

function cubicPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x, y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y };
}

// Signed area sign gives contour winding direction — opentype/TrueType
// outer contours and counter (hole) contours wind opposite ways, which is
// exactly the "is this a hole" signal earcut needs. No dependency on
// font-format-specific winding conventions beyond "opposite of the first
// (outer) contour".
function signedArea(points: number[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i], y1 = points[i + 1];
    const j = (i + 2) % points.length;
    const x2 = points[j], y2 = points[j + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

// Groups contours into "shapes": each shape starts at an outer-winding
// contour and picks up any immediately-following opposite-winding contours
// as its holes. A glyph with multiple independent same-winding sub-shapes
// (e.g. 'i'/'j''s dot, or '%'/'='/'"'/':'/'!'/'?''s disjoint parts) produces
// multiple shapes here, each triangulated with its own earcut call and
// concatenated — same index-rebasing idea buildWarpedGlyphGeometry already
// uses one level up, to concatenate multiple glyphs.
function triangulateGlyph(contours: Contour[]): { positions: number[]; indices: number[] } {
  if (contours.length === 0) return { positions: [], indices: [] };
  const outerSign = Math.sign(signedArea(contours[0].points));

  const positions: number[] = [];
  const indices: number[] = [];
  let shapePositions: number[] = [];
  let shapeHoleIndices: number[] = [];

  const flushShape = () => {
    if (shapePositions.length === 0) return;
    const baseIndex = positions.length / 2;
    const shapeIndices = earcut(shapePositions, shapeHoleIndices.length ? shapeHoleIndices : undefined);
    for (const idx of shapeIndices) indices.push(baseIndex + idx);
    positions.push(...shapePositions);
    shapePositions = [];
    shapeHoleIndices = [];
  };

  for (const contour of contours) {
    const sign = Math.sign(signedArea(contour.points));
    if (sign === outerSign) {
      // A new outer-winding contour starts a new shape — flush whatever
      // shape (outer + its holes) was accumulated so far.
      flushShape();
      shapePositions.push(...contour.points);
    } else {
      shapeHoleIndices.push(shapePositions.length / 2);
      shapePositions.push(...contour.points);
    }
  }
  flushShape();

  return { positions, indices };
}

export function buildWarpedGlyphGeometry(
  font: Font,
  placements: GlyphPlacement[],
  fontSize: number,
  warp: Warp,
  boxWidth: number,
  boxHeight: number,
): { positions: Float32Array; gradientUvs: Float32Array; indices: Uint32Array } {
  const scale = fontSize / font.unitsPerEm;
  const positions: number[] = [];
  const gradientUvs: number[] = [];
  const indices: number[] = [];

  for (const placement of placements) {
    const glyph = font.charToGlyph(placement.char);
    // Raw path.commands (unscaled, y-up) — NOT glyph.getPath(), which would
    // pre-apply scale+flip and cause flattenPath to double-flip. See the
    // comment on flattenPath above.
    const contours = flattenPath(glyph.path.commands as PathCommand[], placement.x, placement.y, scale);
    const { positions: glyphPositions, indices: glyphIndices } = triangulateGlyph(contours);
    if (glyphPositions.length === 0) continue;

    const baseIndex = positions.length / 2;
    for (let i = 0; i < glyphPositions.length; i += 2) {
      const x = glyphPositions[i];
      const y = glyphPositions[i + 1];
      gradientUvs.push(boxWidth === 0 ? 0 : x / boxWidth, boxHeight === 0 ? 0 : y / boxHeight);
      const { dx, dy } = warpDisplacement(warp, x, y, boxWidth, boxHeight);
      positions.push(x + dx, y + dy);
    }
    for (const idx of glyphIndices) indices.push(baseIndex + idx);
  }

  return {
    positions: new Float32Array(positions),
    gradientUvs: new Float32Array(gradientUvs),
    indices: new Uint32Array(indices),
  };
}
