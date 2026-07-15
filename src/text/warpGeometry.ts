export type WarpType = 'arc' | 'wave' | 'bulge' | 'flag' | 'perspective' | 'path';

// The 5 original types bend a flat quad via a per-vertex displacement
// function (see Displacement below); 'path' replaces the quad's baseline
// entirely with a sampled curve, so it's handled separately (computePathGrid).
type BendType = Exclude<WarpType, 'path'>;

export interface WarpGrid {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

// TextNode.warp.pathId resolves to one of these (see schema/document.ts).
export interface PathData {
  points: [number, number, number, number, number, number];
}

// Each displacement fn takes 0..1 grid-normalized (u, v) and returns a 0..1
// normalized offset (fraction of width/height) — computeWarpGrid scales it
// to pixels. u=0..1 spans the text's width, v=0..1 spans its height.
type Displacement = (u: number, v: number, intensity: number) => { dx: number; dy: number };

// Symmetric bump: flat at both ends (u=0/1), max bend at the center — a
// simple, stable "smile" curve. No x-shift, ends stay put.
const arcOffset: Displacement = (u, _v, intensity) => ({ dx: 0, dy: -intensity * Math.cos((u - 0.5) * Math.PI) });

// A few ripples across the width.
const waveOffset: Displacement = (u, _v, intensity) => ({ dx: 0, dy: intensity * Math.sin(u * Math.PI * 4) });

// Radial push outward from the center, falling off toward the edges —
// needs more rows than the x-only warps since it varies with v too.
const bulgeOffset: Displacement = (u, v, intensity) => {
  const du = u - 0.5;
  const dv = v - 0.5;
  const dist = Math.sqrt(du * du + dv * dv);
  const push = Math.max(0, intensity * (1 - dist * 2));
  return { dx: du * push, dy: dv * push };
};

// Like wave, but amplitude grows from the anchored end (u=0) toward the
// free end (u=1) — a flag waving in the wind.
const flagOffset: Displacement = (u, _v, intensity) => ({ dx: 0, dy: intensity * Math.sin(u * Math.PI * 4) * u });

// Trapezoid taper: top and bottom edges scale oppositely around the
// horizontal center, simulating a simple one-axis perspective.
const perspectiveOffset: Displacement = (u, v, intensity) => ({ dx: (u - 0.5) * intensity * (v - 0.5) * 2, dy: 0 });

const DISPLACEMENT: Record<BendType, Displacement> = {
  arc: arcOffset,
  wave: waveOffset,
  bulge: bulgeOffset,
  flag: flagOffset,
  perspective: perspectiveOffset,
};

// bulge is the only warp whose offset varies with v — it needs vertical
// grid resolution to look radial instead of blocky. The rest only bend
// along u, so 1 row (top+bottom edge, 2 vertex rows) is enough.
const ROWS: Record<BendType, number> = { arc: 1, wave: 1, flag: 1, perspective: 1, bulge: 8 };

function buildIndices(cols: number, rows: number, vertsPerRow: number): Uint32Array {
  const indices = new Uint32Array(rows * cols * 6);
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i0 = r * vertsPerRow + c;
      const i1 = i0 + 1;
      const i2 = i0 + vertsPerRow;
      const i3 = i2 + 1;
      indices[idx++] = i0;
      indices[idx++] = i2;
      indices[idx++] = i1;
      indices[idx++] = i1;
      indices[idx++] = i2;
      indices[idx++] = i3;
    }
  }
  return indices;
}

function bezierPoint(p: PathData['points'], t: number): { x: number; y: number } {
  const mt = 1 - t;
  return { x: mt * mt * p[0] + 2 * mt * t * p[2] + t * t * p[4], y: mt * mt * p[1] + 2 * mt * t * p[3] + t * t * p[5] };
}

function bezierTangent(p: PathData['points'], t: number): { x: number; y: number } {
  const mt = 1 - t;
  return { x: 2 * mt * (p[2] - p[0]) + 2 * t * (p[4] - p[2]), y: 2 * mt * (p[3] - p[1]) + 2 * t * (p[5] - p[3]) };
}

const ARC_LENGTH_SAMPLES = 64;

// Dense t -> cumulative-length lookup (in the actual pixel-scaled space, so
// spacing looks uniform once u/v is scaled by width/height), inverted below
// to place grid columns at even arc-length steps instead of even t steps —
// otherwise glyphs would bunch up on tight parts of the curve.
function arcLengthTable(points: PathData['points'], width: number, height: number): { t: number; length: number }[] {
  const table = [{ t: 0, length: 0 }];
  let prev = bezierPoint(points, 0);
  let length = 0;
  for (let i = 1; i <= ARC_LENGTH_SAMPLES; i++) {
    const t = i / ARC_LENGTH_SAMPLES;
    const p = bezierPoint(points, t);
    length += Math.hypot((p.x - prev.x) * width, (p.y - prev.y) * height);
    table.push({ t, length });
    prev = p;
  }
  return table;
}

function tAtLength(table: { t: number; length: number }[], targetLength: number): number {
  for (let i = 1; i < table.length; i++) {
    if (table[i].length >= targetLength) {
      const { t: t0, length: l0 } = table[i - 1];
      const { t: t1, length: l1 } = table[i];
      const frac = l1 === l0 ? 0 : (targetLength - l0) / (l1 - l0);
      return t0 + frac * (t1 - t0);
    }
  }
  return 1;
}

// A straight horizontal line — used when a text node's warp.type is 'path'
// but its pathId doesn't resolve (missing/stale). Degenerates to a flat,
// undeformed quad rather than throwing, matching the "silently inert"
// convention effects/buildFilters.ts uses for unmapped effect types.
const FLAT_PATH: PathData = { points: [0, 0.5, 0.5, 0.5, 1, 0.5] };

// Replaces the flat quad's baseline with the path curve: columns are placed
// at even arc-length steps along it, and the top/bottom rows are offset
// perpendicular to the curve's tangent (not just vertically, like the other
// warp types) by half the text height — otherwise the text band would look
// sheared wherever the path isn't near-horizontal.
function computePathGrid(path: PathData, width: number, height: number, cols: number): WarpGrid {
  const rows = 1;
  const vertsPerRow = cols + 1;
  const vertCount = vertsPerRow * (rows + 1);
  const positions = new Float32Array(vertCount * 2);
  const uvs = new Float32Array(vertCount * 2);

  const table = arcLengthTable(path.points, width, height);
  const totalLength = table[table.length - 1].length;

  for (let c = 0; c <= cols; c++) {
    const u = c / cols;
    const t = totalLength > 0 ? tAtLength(table, u * totalLength) : u;
    const p = bezierPoint(path.points, t);
    const tan = bezierTangent(path.points, t);
    const px = p.x * width;
    const py = p.y * height;
    // Perpendicular to the tangent, in the same anisotropically-scaled
    // pixel space as px/py (so it's actually perpendicular after scaling).
    const nx = -tan.y * height;
    const ny = tan.x * width;
    const nLen = Math.hypot(nx, ny) || 1;

    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      const offset = (v - 0.5) * height;
      const i = (r * vertsPerRow + c) * 2;
      positions[i] = px + (nx / nLen) * offset;
      positions[i + 1] = py + (ny / nLen) * offset;
      uvs[i] = u;
      uvs[i + 1] = v;
    }
  }

  return { positions, uvs, indices: buildIndices(cols, rows, vertsPerRow) };
}

export function computeWarpGrid(
  type: WarpType,
  intensity: number,
  width: number,
  height: number,
  cols = 32,
  path?: PathData,
): WarpGrid {
  if (type === 'path') return computePathGrid(path ?? FLAT_PATH, width, height, cols);

  const rows = ROWS[type];
  const displace = DISPLACEMENT[type];
  const vertsPerRow = cols + 1;
  const vertCount = vertsPerRow * (rows + 1);

  const positions = new Float32Array(vertCount * 2);
  const uvs = new Float32Array(vertCount * 2);

  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const { dx, dy } = displace(u, v, intensity);
      const i = (r * vertsPerRow + c) * 2;
      positions[i] = u * width + dx * width;
      positions[i + 1] = v * height + dy * height;
      uvs[i] = u;
      uvs[i + 1] = v;
    }
  }

  return { positions, uvs, indices: buildIndices(cols, rows, vertsPerRow) };
}
