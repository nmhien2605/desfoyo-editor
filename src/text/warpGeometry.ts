export type WarpType = 'arc' | 'wave' | 'bulge' | 'flag' | 'perspective';

export interface WarpGrid {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
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

const DISPLACEMENT: Record<WarpType, Displacement> = {
  arc: arcOffset,
  wave: waveOffset,
  bulge: bulgeOffset,
  flag: flagOffset,
  perspective: perspectiveOffset,
};

// bulge is the only warp whose offset varies with v — it needs vertical
// grid resolution to look radial instead of blocky. The rest only bend
// along u, so 1 row (top+bottom edge, 2 vertex rows) is enough.
const ROWS: Record<WarpType, number> = { arc: 1, wave: 1, flag: 1, perspective: 1, bulge: 8 };

export function computeWarpGrid(type: WarpType, intensity: number, width: number, height: number, cols = 32): WarpGrid {
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

  return { positions, uvs, indices };
}
