// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlurFilter } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import {
  MAX_TEXTURE_SIDE,
  acquireImage,
  buildImageFilters,
  cachedImageCount,
  decodeImage,
  rasterSize,
  releaseImage,
} from '../renderers/imageRenderer';

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

  it('rasterises SVG at 2x natural size, capped at 2048 px', async () => {
    stubImage(100, 50);
    const small = await decodeImage('https://cdn.test/small.svg');
    expect([small.source.pixelWidth, small.source.pixelHeight]).toEqual([200, 100]);
    stubImage(4000, 2000);
    const big = await decodeImage('https://cdn.test/big.svg');
    expect([big.source.pixelWidth, big.source.pixelHeight]).toEqual([2048, 1024]);
  });
});

describe('rasterSize', () => {
  it('keeps small bitmaps at natural size and SVG at 2x', () => {
    expect(rasterSize(800, 600, false)).toEqual({ width: 800, height: 600 });
    expect(rasterSize(800, 600, true)).toEqual({ width: 1600, height: 1200 });
  });

  it('caps the longest side at MAX_TEXTURE_SIDE, scaling uniformly', () => {
    expect(MAX_TEXTURE_SIDE).toBe(2048);
    expect(rasterSize(4032, 3024, false)).toEqual({ width: 2048, height: 1536 });
    expect(rasterSize(3024, 4032, false)).toEqual({ width: 1536, height: 2048 });
    // Stage backdrop SVG measured in the web: 2017×1724 → was 4034×3448.
    expect(rasterSize(2017, 1724, true)).toEqual({ width: 2048, height: 1750 });
  });
});

describe('acquireImage / releaseImage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shares one decode per src and destroys it after the last release', async () => {
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(10);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(10);
    const src = 'https://cdn.test/shared.png';
    const before = cachedImageCount();
    const a = await acquireImage(src);
    const b = await acquireImage(src);
    expect(b).toBe(a);
    expect(cachedImageCount()).toBe(before + 1);
    const destroy = vi.spyOn(a, 'destroy');

    releaseImage(src);
    await Promise.resolve();
    await Promise.resolve();
    expect(destroy).not.toHaveBeenCalled();

    // Remount: release + re-acquire in the same tick keeps the decode.
    releaseImage(src);
    expect(await acquireImage(src)).toBe(a);
    await Promise.resolve();
    expect(destroy).not.toHaveBeenCalled();

    releaseImage(src);
    await Promise.resolve();
    await Promise.resolve();
    expect(destroy).toHaveBeenCalledWith(true);
    expect(cachedImageCount()).toBe(before);
  });
});
