import { describe, expect, it } from 'vitest';
import { extrudeLayerOffset, extrudeLayerShade, extrudeSteps } from '../extrudeLayers';

describe('extrudeSteps', () => {
  it('rounds depth up to a whole number of layers', () => {
    expect(extrudeSteps(4.2)).toBe(5);
    expect(extrudeSteps(1)).toBe(1);
  });

  it('never returns fewer than 1 step, even for zero/negative depth', () => {
    expect(extrudeSteps(0)).toBe(1);
    expect(extrudeSteps(-3)).toBe(1);
  });

  it('caps at 40 steps regardless of how large depth is', () => {
    expect(extrudeSteps(1000)).toBe(40);
  });
});

describe('extrudeLayerOffset', () => {
  it('offsets along (cos(angle), sin(angle)) scaled by layerDepth * (depth/steps)', () => {
    const offset = extrudeLayerOffset(2, 4, 8, 0);
    // angle 0 -> pure +x; layerDepth 2 of 4 steps at depth 8 -> stepSize 2 -> 2*2 = 4
    expect(offset.x).toBeCloseTo(4);
    expect(offset.y).toBeCloseTo(0);
  });

  it('the deepest layer (layerDepth === steps) offsets by the full depth', () => {
    const offset = extrudeLayerOffset(5, 5, 10, Math.PI / 2);
    expect(offset.x).toBeCloseTo(0);
    expect(offset.y).toBeCloseTo(10);
  });
});

describe('extrudeLayerShade', () => {
  it('is 1 (undarkened) at the front face and darkens monotonically with depth', () => {
    const steps = 4;
    const shades = [1, 2, 3, 4].map((d) => extrudeLayerShade(d, steps));
    for (let i = 1; i < shades.length; i++) expect(shades[i]).toBeLessThan(shades[i - 1]);
    expect(extrudeLayerShade(0, steps)).toBeCloseTo(1);
  });

  it('never darkens all the way to black at the deepest layer', () => {
    expect(extrudeLayerShade(40, 40)).toBeCloseTo(0.4);
  });
});
