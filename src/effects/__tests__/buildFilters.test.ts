// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BlurFilter, Color, Filter } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import { buildFilters, darkenColor } from '../buildFilters';
import type { Effect } from '../../schema';
import type { TextNode } from '../../schema';

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

  it('builds a custom Filter for inner-shadow', () => {
    const effects: Effect[] = [{ type: 'inner-shadow', color: '#000000', blur: 1, offset: [2, 2], alpha: 0.8 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(Filter);
  });

  it('builds a custom Filter for line-shadow', () => {
    const effects: Effect[] = [{ type: 'line-shadow', color: '#000000', offset: [6, 6], thickness: 1, alpha: 0.9 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(Filter);
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

  it('scales shadow blur/offset by font size when applied to a text node', () => {
    const node: TextNode = {
      id: 'text-1',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      type: 'text',
      content: 'Hi',
      font: { family: 'Roboto', size: 50 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };
    const effects: Effect[] = [{ type: 'shadow', color: '#ff0000', blur: 0.1, offset: [0.02, 0.04], alpha: 0.5 }];
    const [filter] = buildFilters(effects, node) as [DropShadowFilter];
    expect(filter.blur).toBeCloseTo(5); // 0.1 * 50
    expect(filter.offset.x).toBeCloseTo(1); // 0.02 * 50
    expect(filter.offset.y).toBeCloseTo(2); // 0.04 * 50
  });

  it('does not scale shadow blur/offset for a shape node (basis stays 1)', () => {
    const effects: Effect[] = [{ type: 'shadow', color: '#ff0000', blur: 4, offset: [2, 3], alpha: 0.5 }];
    const [filter] = buildFilters(effects) as [DropShadowFilter]; // no node argument at all — matches every pre-existing call in this file
    expect(filter.blur).toBe(4);
    expect(filter.offset.x).toBe(2);
    expect(filter.offset.y).toBe(3);
  });

  it('builds a hard-edged DropShadowFilter (blur 0) for block-shadow', () => {
    const effects: Effect[] = [{ type: 'block-shadow', color: '#000000', offset: [4, 5], alpha: 0.8 }];
    const [filter] = buildFilters(effects) as [DropShadowFilter];
    expect(filter).toBeInstanceOf(DropShadowFilter);
    expect(filter.blur).toBe(0);
    expect(filter.offset.x).toBe(4);
    expect(filter.offset.y).toBe(5);
  });

  it('scales block-shadow offset by font size for a text node', () => {
    const node: TextNode = {
      id: 'text-1',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      type: 'text',
      content: 'Hi',
      font: { family: 'Roboto', size: 40 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };
    const effects: Effect[] = [{ type: 'block-shadow', color: '#000000', offset: [0.1, 0.1], alpha: 0.8 }];
    const [filter] = buildFilters(effects, node) as [DropShadowFilter];
    expect(filter.offset.x).toBeCloseTo(4); // 0.1 * 40
  });

  it('builds a chain of SHADOW_3D_STEPS DropShadowFilters for 3d-shadow, each darker than the last', () => {
    const effects: Effect[] = [{ type: '3d-shadow', color: '#ffffff', angle: 0, depth: 12, alpha: 1 }];
    const filters = buildFilters(effects) as DropShadowFilter[];
    expect(filters).toHaveLength(6);
    for (const filter of filters) expect(filter).toBeInstanceOf(DropShadowFilter);
    // angle 0 -> offset is purely along x, increasing with each step
    expect(filters[0].offset.x).toBeLessThan(filters[5].offset.x);
    expect(filters[5].offset.x).toBeCloseTo(12); // last step reaches full depth
    // each step's color should darken monotonically toward black
    const toRed = (f: DropShadowFilter) => new Color(f.color).toArray()[0];
    expect(toRed(filters[0])).toBeGreaterThan(toRed(filters[5]));
  });

  it('darkenColor scales rgb channels toward black without throwing on white or black input', () => {
    const half = darkenColor('#ffffff', 0.5);
    const value = parseInt(half.replace('#', ''), 16);
    const r = (value >> 16) & 0xff;
    expect(r).toBeGreaterThan(100);
    expect(r).toBeLessThan(150);
    expect(darkenColor('#000000', 0.5)).toBe('#000000');
  });
});
