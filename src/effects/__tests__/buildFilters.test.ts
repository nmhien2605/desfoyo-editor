// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BlurFilter, Filter } from 'pixi.js';
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

  it('builds a custom Filter for a known custom shaderId', () => {
    const effects: Effect[] = [{ type: 'custom', shaderId: 'chromatic-aberration', uniforms: { strength: 2 } }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(Filter);
  });

  it('produces no filter for an unknown custom shaderId', () => {
    const effects: Effect[] = [{ type: 'custom', shaderId: 'does-not-exist', uniforms: {} }];
    expect(buildFilters(effects)).toEqual([]);
  });

  it('text-shadow style=drop builds a DropShadowFilter with angle/distance converted to px offset via fontSize', () => {
    const effects: Effect[] = [
      { type: 'text-shadow', style: 'drop', color: '#111111', angle: 0, distance: 0.1, blur: 6 },
    ];
    const filters = buildFilters(effects, 100); // fontSize=100 => distance*fontSize=10px
    expect(filters).toHaveLength(1);
    expect(filters[0]).toBeInstanceOf(DropShadowFilter);
    const f = filters[0] as DropShadowFilter;
    expect(f.blur).toBe(6);
  });

  it('text-shadow style=line/block/3d builds NO filter — geometry handles it, not buildFilters', () => {
    for (const style of ['line', 'block', '3d'] as const) {
      const effects: Effect[] = [{ type: 'text-shadow', style, color: '#000', angle: 0, distance: 0.1 }];
      expect(buildFilters(effects, 100)).toHaveLength(0);
    }
  });

  it('text-shadow style=drop khong lam gi khi thieu fontSize (node khong phai text)', () => {
    const effects: Effect[] = [{ type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 }];
    expect(buildFilters(effects)).toHaveLength(0);
  });
});
