// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlurFilter } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import { buildImageFilters, decodeImage } from '../renderers/imageRenderer';

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

describe('decodeImage', () => {
  afterEach(() => vi.restoreAllMocks());

  const stubImage = (w: number, h: number) => {
    // jsdom has no img.decode()
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(w);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(h);
    const ctx = { drawImage: () => {} };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as ReturnType<HTMLCanvasElement['getContext']>,
    );
  };

  // Large sources drawn small skip thin strokes without mipmaps (dotted lines).
  it('turns on mipmaps for SVG and raster sources', async () => {
    stubImage(100, 50);
    const svg = await decodeImage('data:image/svg+xml,<svg/>');
    const png = await decodeImage('https://cdn.test/a.png');
    expect(svg.source.autoGenerateMipmaps).toBe(true);
    expect(png.source.autoGenerateMipmaps).toBe(true);
  });

  it('rasterises SVG at 2x natural size, capped at 4096 px', async () => {
    stubImage(100, 50);
    const small = await decodeImage('https://cdn.test/small.svg');
    expect([small.source.pixelWidth, small.source.pixelHeight]).toEqual([200, 100]);
    stubImage(4000, 2000);
    const big = await decodeImage('https://cdn.test/big.svg');
    expect([big.source.pixelWidth, big.source.pixelHeight]).toEqual([4096, 2048]);
  });
});
