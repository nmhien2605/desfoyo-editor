// Kept intentionally decoupled from src/schema/node.ts's WarpSchema (Task 4)
// so this pure-math module has zero dependency on Zod/schema types — Task 4
// must keep TextNode['warp']'s shape identical to this local type.
export type Warp =
  | { type: 'arch'; curve: number }
  | { type: 'wave'; amplitude: number; frequency: number }
  | { type: 'rise'; amount: number }
  | { type: 'flag'; amplitude: number; frequency: number }
  | { type: 'circle'; curve: number }
  | { type: 'distort'; amountX: number; amountY: number }
  | { type: 'angle'; angle: number }
  | { type: 'custom-mesh'; gridSize: [number, number]; points: number[] };

export interface Displacement {
  dx: number;
  dy: number;
}

// x/y are in the text box's local units (same as node.size), not normalized.
// boxWidth/boxHeight give each formula the box to normalize against.
export function warpDisplacement(warp: Warp, x: number, y: number, boxWidth: number, boxHeight: number): Displacement {
  const nx = boxWidth === 0 ? 0 : x / boxWidth; // 0..1 across the box
  switch (warp.type) {
    case 'arch':
      // Parabolic arc: 0 at both edges, peak at center. sin(nx*PI) does this
      // in one term without a separate edge-clamp.
      return { dx: 0, dy: -warp.curve * Math.sin(nx * Math.PI) * boxHeight };
    case 'wave':
      return { dx: 0, dy: warp.amplitude * Math.sin(nx * warp.frequency * 2 * Math.PI) * boxHeight };
    case 'rise':
      return { dx: 0, dy: -warp.amount * nx * boxHeight };
    case 'flag':
      // Same oscillation as 'wave', but amplitude scales by nx so the left
      // edge (the flag's "pinned" side) stays put and displacement grows
      // toward the right — this taper is the one thing distinguishing it
      // from 'wave'.
      return { dx: 0, dy: warp.amplitude * nx * Math.sin(nx * warp.frequency * 2 * Math.PI) * boxHeight };
    case 'circle': {
      if (warp.curve === 0) return { dx: 0, dy: 0 };
      const radius = boxWidth / (2 * Math.abs(warp.curve) * Math.PI);
      const angle = (nx - 0.5) * (boxWidth / radius);
      const sign = Math.sign(warp.curve);
      const cx = 0;
      const cy = sign * radius;
      const px = cx + radius * Math.sin(angle);
      const py = cy - sign * radius * Math.cos(angle);
      return { dx: px - (x - boxWidth / 2), dy: py - y };
    }
    case 'distort': {
      const ny = boxHeight === 0 ? 0 : y / boxHeight;
      return { dx: warp.amountX * nx * (1 - nx), dy: warp.amountY * ny * (1 - ny) };
    }
    case 'angle':
      return { dx: y * Math.tan(warp.angle), dy: 0 };
    case 'custom-mesh':
      return bilinearDisplacement(warp, nx, boxHeight === 0 ? 0 : y / boxHeight);
  }
}

function bilinearDisplacement(warp: Extract<Warp, { type: 'custom-mesh' }>, nx: number, ny: number): Displacement {
  const [cols, rows] = warp.gridSize;
  const gx = nx * (cols - 1);
  const gy = ny * (rows - 1);
  const x0 = Math.min(Math.floor(gx), cols - 2 < 0 ? 0 : cols - 2);
  const y0 = Math.min(Math.floor(gy), rows - 2 < 0 ? 0 : rows - 2);
  const tx = cols > 1 ? gx - x0 : 0;
  const ty = rows > 1 ? gy - y0 : 0;

  const at = (cx: number, cy: number): Displacement => {
    const i = (cy * cols + cx) * 2;
    return { dx: warp.points[i] ?? 0, dy: warp.points[i + 1] ?? 0 };
  };
  const p00 = at(x0, y0);
  const p10 = at(x0 + 1, y0);
  const p01 = at(x0, y0 + 1);
  const p11 = at(x0 + 1, y0 + 1);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return {
    dx: lerp(lerp(p00.dx, p10.dx, tx), lerp(p01.dx, p11.dx, tx), ty),
    dy: lerp(lerp(p00.dy, p10.dy, tx), lerp(p01.dy, p11.dy, tx), ty),
  };
}
