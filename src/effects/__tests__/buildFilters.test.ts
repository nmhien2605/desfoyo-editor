// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BlurFilter } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import { buildFilters } from '../buildFilters';
import type { Effect } from '../../schema';

describe('buildFilters', () => {
  it('returns an empty array for undefined effects', () => {
    expect(buildFilters(undefined)).toEqual([]);
  });

  it('builds a DropShadowFilter for shadow', () => {
    const effects: Effect[] = [{ type: 'shadow', color: '#ff0000', blur: 4, offset: [2, 3], alpha: 0.5 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(DropShadowFilter);
  });

  it('builds a GlowFilter for glow', () => {
    const effects: Effect[] = [{ type: 'glow', color: '#ffffff', strength: 3, outer: true }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(GlowFilter);
    expect((filter as GlowFilter).outerStrength).toBe(3);
    expect((filter as GlowFilter).innerStrength).toBe(0);
  });

  it('builds an OutlineFilter for outline', () => {
    const effects: Effect[] = [{ type: 'outline', color: '#000000', thickness: 5 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(OutlineFilter);
    expect((filter as OutlineFilter).thickness).toBe(5);
  });

  it('builds a BlurFilter for blur', () => {
    const effects: Effect[] = [{ type: 'blur', amount: 7 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(BlurFilter);
    expect((filter as BlurFilter).strength).toBe(7);
  });

  it('builds a BevelFilter approximation for extrude3d', () => {
    const effects: Effect[] = [{ type: 'extrude3d', depth: 6, angle: Math.PI / 2, color: '#123456' }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(BevelFilter);
    expect((filter as BevelFilter).thickness).toBe(6);
    expect((filter as BevelFilter).rotation).toBeCloseTo(90);
  });

  it('produces no filter for still-inert inner-shadow and custom', () => {
    const effects: Effect[] = [
      { type: 'inner-shadow', color: '#000000', blur: 1, offset: [0, 0], alpha: 1 },
      { type: 'custom', shaderId: 'foo', uniforms: {} },
    ];
    expect(buildFilters(effects)).toEqual([]);
  });
});
