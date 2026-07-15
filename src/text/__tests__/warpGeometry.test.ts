import { describe, expect, it } from 'vitest';
import { computeWarpGrid, type WarpType } from '../warpGeometry';

const WIDTH = 200;
const HEIGHT = 40;

function vertexAt(grid: ReturnType<typeof computeWarpGrid>, cols: number, row: number, col: number): { x: number; y: number } {
  const i = (row * (cols + 1) + col) * 2;
  return { x: grid.positions[i], y: grid.positions[i + 1] };
}

describe('computeWarpGrid', () => {
  it('intensity 0 returns an undisplaced grid for every warp type', () => {
    const types: WarpType[] = ['arc', 'wave', 'bulge', 'flag', 'perspective'];
    for (const type of types) {
      const grid = computeWarpGrid(type, 0, WIDTH, HEIGHT, 4);
      // top-left, top-right, bottom-left, bottom-right should sit exactly on the rectangle corners
      const rows = grid.positions.length / 2 / 5 - 1; // 5 = cols+1 for cols=4
      const topLeft = vertexAt(grid, 4, 0, 0);
      const topRight = vertexAt(grid, 4, 0, 4);
      const bottomLeft = vertexAt(grid, 4, rows, 0);
      const bottomRight = vertexAt(grid, 4, rows, 4);
      expect(topLeft).toEqual({ x: 0, y: 0 });
      expect(topRight).toEqual({ x: WIDTH, y: 0 });
      expect(bottomLeft.x).toBeCloseTo(0);
      expect(bottomRight.x).toBeCloseTo(WIDTH);
    }
  });

  it('arc bends symmetrically: both ends flat, center displaced', () => {
    const grid = computeWarpGrid('arc', 10, WIDTH, HEIGHT, 4);
    const left = vertexAt(grid, 4, 0, 0);
    const right = vertexAt(grid, 4, 0, 4);
    const center = vertexAt(grid, 4, 0, 2);
    expect(left.y).toBeCloseTo(0);
    expect(right.y).toBeCloseTo(0);
    expect(center.y).not.toBeCloseTo(0);
    // dy is a fraction of height (scaled by HEIGHT when building positions);
    // at u=0.5, arcOffset's dy = -intensity, so the pixel offset is -intensity * HEIGHT.
    expect(center.y).toBeCloseTo(-10 * HEIGHT);
  });

  it('bulge pushes points outward from the center and fades at the edges', () => {
    const grid = computeWarpGrid('bulge', 0.5, WIDTH, HEIGHT, 4);
    const cols = 4;
    const rows = 8;
    // A point exactly at the center has no direction to push in (radial
    // displacement from itself is zero) — only points *around* it move.
    const center = vertexAt(grid, cols, rows / 2, cols / 2);
    expect(center.x).toBeCloseTo(WIDTH / 2);
    expect(center.y).toBeCloseTo(HEIGHT / 2);

    // A point near the center (but not on it) should move away from center.
    const nearCenter = vertexAt(grid, cols, rows / 2, cols / 2 + 1);
    const nearCenterRestX = (cols / 2 + 1) * (WIDTH / cols);
    expect(nearCenter.x).toBeGreaterThan(nearCenterRestX);

    // The far corner (max distance from center) should stay at/near its
    // original position — the falloff should have reached ~0 push by then.
    const corner = vertexAt(grid, cols, 0, 0);
    expect(corner.x).toBeCloseTo(0);
    expect(corner.y).toBeCloseTo(0);
  });

  it('produces a valid triangle-list index buffer (multiple of 3, in bounds)', () => {
    const grid = computeWarpGrid('wave', 5, WIDTH, HEIGHT, 4);
    expect(grid.indices.length % 3).toBe(0);
    const vertCount = grid.positions.length / 2;
    for (const i of grid.indices) expect(i).toBeLessThan(vertCount);
  });
});

describe('path warp', () => {
  const cols = 4;
  // A straight horizontal line at v=0.5 — degenerates to the same shape as
  // an undisplaced rect, so exact positions are easy to assert against.
  const straight = { points: [0, 0.5, 0.5, 0.5, 1, 0.5] as [number, number, number, number, number, number] };
  // A gentle upward arc (same default the properties panel creates).
  const arc = { points: [0, 0.5, 0.5, 0, 1, 0.5] as [number, number, number, number, number, number] };

  it('a straight-line path renders as an undisplaced rectangle', () => {
    const grid = computeWarpGrid('path', 0, WIDTH, HEIGHT, cols, straight);
    const topLeft = vertexAt(grid, cols, 0, 0);
    const topRight = vertexAt(grid, cols, 0, cols);
    const bottomLeft = vertexAt(grid, cols, 1, 0);
    const bottomRight = vertexAt(grid, cols, 1, cols);
    expect(topLeft.x).toBeCloseTo(0);
    expect(topLeft.y).toBeCloseTo(0);
    expect(topRight.x).toBeCloseTo(WIDTH);
    expect(topRight.y).toBeCloseTo(0);
    expect(bottomLeft.y).toBeCloseTo(HEIGHT);
    expect(bottomRight.x).toBeCloseTo(WIDTH);
    expect(bottomRight.y).toBeCloseTo(HEIGHT);
  });

  it('u=0/u=1 columns land on the path\'s start/end points', () => {
    const grid = computeWarpGrid('path', 0, WIDTH, HEIGHT, cols, arc);
    // Row 0 (v=0, "top" edge) is offset half a height above the curve —
    // averaging the top/bottom rows at a column recovers the curve point.
    const startTop = vertexAt(grid, cols, 0, 0);
    const startBottom = vertexAt(grid, cols, 1, 0);
    const endTop = vertexAt(grid, cols, 0, cols);
    const endBottom = vertexAt(grid, cols, 1, cols);
    expect((startTop.x + startBottom.x) / 2).toBeCloseTo(arc.points[0] * WIDTH);
    expect((startTop.y + startBottom.y) / 2).toBeCloseTo(arc.points[1] * HEIGHT);
    expect((endTop.x + endBottom.x) / 2).toBeCloseTo(arc.points[4] * WIDTH);
    expect((endTop.y + endBottom.y) / 2).toBeCloseTo(arc.points[5] * HEIGHT);
  });

  it('the two rows straddle the curve, HEIGHT apart, perpendicular to the tangent', () => {
    const grid = computeWarpGrid('path', 0, WIDTH, HEIGHT, cols, straight);
    // Tangent is purely horizontal for a straight line, so the perpendicular
    // offset is purely vertical — top/bottom rows should be exactly HEIGHT apart in y.
    for (let c = 0; c <= cols; c++) {
      const top = vertexAt(grid, cols, 0, c);
      const bottom = vertexAt(grid, cols, 1, c);
      expect(bottom.y - top.y).toBeCloseTo(HEIGHT);
      expect(bottom.x - top.x).toBeCloseTo(0);
    }
  });

  it('falls back to a flat rectangle when no path data is given (missing/stale pathId)', () => {
    const grid = computeWarpGrid('path', 0, WIDTH, HEIGHT, cols);
    const topLeft = vertexAt(grid, cols, 0, 0);
    const bottomRight = vertexAt(grid, cols, 1, cols);
    expect(topLeft).toEqual({ x: 0, y: 0 });
    expect(bottomRight.x).toBeCloseTo(WIDTH);
    expect(bottomRight.y).toBeCloseTo(HEIGHT);
  });

  it('produces a valid triangle-list index buffer', () => {
    const grid = computeWarpGrid('path', 0, WIDTH, HEIGHT, cols, arc);
    expect(grid.indices.length % 3).toBe(0);
    const vertCount = grid.positions.length / 2;
    for (const i of grid.indices) expect(i).toBeLessThan(vertCount);
  });
});
