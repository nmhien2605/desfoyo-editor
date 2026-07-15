// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BlurFilter } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import { buildImageFilters } from '../renderers/imageRenderer';

describe('buildImageFilters', () => {
  it('returns an empty array for undefined filters', () => {
    expect(buildImageFilters(undefined)).toEqual([]);
  });

  it('returns an empty array when no filter values are set', () => {
    expect(buildImageFilters({})).toEqual([]);
  });

  it('builds an AdjustmentFilter for brightness/contrast/saturation', () => {
    const filters = buildImageFilters({ brightness: 1.5, contrast: 0.8, saturation: 1.2 });
    expect(filters).toHaveLength(1);
    expect(filters[0]).toBeInstanceOf(AdjustmentFilter);
    const adjustment = filters[0] as AdjustmentFilter;
    expect(adjustment.brightness).toBe(1.5);
    expect(adjustment.contrast).toBe(0.8);
    expect(adjustment.saturation).toBe(1.2);
  });

  it('leaves unset adjustment knobs at their default (not overridden with undefined)', () => {
    const filters = buildImageFilters({ brightness: 1.5 });
    const adjustment = filters[0] as AdjustmentFilter;
    expect(adjustment.contrast).toBe(1);
    expect(adjustment.saturation).toBe(1);
  });

  it('builds a BlurFilter for blur', () => {
    const filters = buildImageFilters({ blur: 6 });
    expect(filters).toHaveLength(1);
    expect(filters[0]).toBeInstanceOf(BlurFilter);
    expect((filters[0] as BlurFilter).strength).toBe(6);
  });

  it('builds both filters when adjustment and blur are set together', () => {
    const filters = buildImageFilters({ brightness: 1.2, blur: 3 });
    expect(filters).toHaveLength(2);
  });
});
