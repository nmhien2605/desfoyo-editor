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
