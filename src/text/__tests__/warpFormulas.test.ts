import { describe, it, expect } from 'vitest';
import { warpDisplacement } from '../warpFormulas';

describe('warpDisplacement', () => {
  it('arch: bows the vertical center up the most, edges not at all', () => {
    const box = { boxWidth: 100, boxHeight: 20 };
    const center = warpDisplacement({ type: 'arch', curve: 1 }, 50, 0, box.boxWidth, box.boxHeight);
    const edge = warpDisplacement({ type: 'arch', curve: 1 }, 0, 0, box.boxWidth, box.boxHeight);
    expect(Math.abs(center.dy)).toBeGreaterThan(Math.abs(edge.dy));
    expect(edge.dy).toBeCloseTo(0, 5);
  });

  it('wave: oscillates with the given frequency', () => {
    const d1 = warpDisplacement({ type: 'wave', amplitude: 1, frequency: 1 }, 0, 0, 100, 20);
    const d2 = warpDisplacement({ type: 'wave', amplitude: 1, frequency: 1 }, 100, 0, 100, 20);
    expect(d1.dy).toBeCloseTo(d2.dy, 5); // one full period across the box
  });

  it('rise: linear baseline slant proportional to amount', () => {
    const half = warpDisplacement({ type: 'rise', amount: 0.5 }, 100, 0, 100, 20);
    const full = warpDisplacement({ type: 'rise', amount: 1 }, 100, 0, 100, 20);
    expect(full.dy).toBeCloseTo(half.dy * 2, 5);
  });

  it('flag: amplitude tapers to zero at the pinned left edge', () => {
    const left = warpDisplacement({ type: 'flag', amplitude: 1, frequency: 1 }, 0, 0, 100, 20);
    expect(left.dy).toBeCloseTo(0, 5);
  });

  it('circle: curve=0 is a no-op', () => {
    const d = warpDisplacement({ type: 'circle', curve: 0 }, 50, 0, 100, 20);
    expect(d.dx).toBeCloseTo(0, 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('distort: independent per-axis bulge, zero at box edges', () => {
    const d = warpDisplacement({ type: 'distort', amountX: 10, amountY: 5 }, 0, 0, 100, 20);
    expect(d.dx).toBeCloseTo(0, 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('angle: pure shear proportional to y', () => {
    const d = warpDisplacement({ type: 'angle', angle: Math.PI / 4 }, 50, 10, 100, 20);
    expect(d.dx).toBeCloseTo(10 * Math.tan(Math.PI / 4), 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('custom-mesh: bilinear-interpolates a 2x2 control grid', () => {
    // 2x2 grid, all points pushed down by 10 uniformly -> every vertex shifts down by 10
    const warp = { type: 'custom-mesh' as const, gridSize: [2, 2] as [number, number], points: [0, 10, 0, 10, 0, 10, 0, 10] };
    const d = warpDisplacement(warp, 50, 10, 100, 20);
    expect(d.dy).toBeCloseTo(10, 5);
  });
});
