// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_TEXTURE_SIDE, decodeImage, imageRenderer, setImageSrcResolver } from '../renderers/imageRenderer';
import { loadsSettled } from '../pendingLoads';
import type { Document, ImageNode } from '../../schema';

// Records every URL an <img> decodes; URLs in `broken` fail like a 5xx from the optimizer.
let decoded: string[] = [];
let broken = new Set<string>();

beforeEach(() => {
  decoded = [];
  broken = new Set();
  HTMLImageElement.prototype.decode = function (this: HTMLImageElement) {
    decoded.push(this.src);
    return broken.has(this.src) ? Promise.reject(new Error('404')) : Promise.resolve();
  };
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(10);
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(10);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: () => {} } as never);
});

afterEach(() => {
  setImageSrcResolver(null);
  vi.restoreAllMocks();
});

const resized = (src: string, maxSide: number) => `https://web.test/_next/image?url=${encodeURIComponent(src)}&w=${maxSide}`;

describe('setImageSrcResolver', () => {
  it('decodes remote rasters from the resolved URL, passing MAX_TEXTURE_SIDE', async () => {
    const resolver = vi.fn(resized);
    setImageSrcResolver(resolver);
    await decodeImage('https://cdn.test/huge.png');
    expect(resolver).toHaveBeenCalledWith('https://cdn.test/huge.png', MAX_TEXTURE_SIDE);
    expect(decoded).toEqual([resized('https://cdn.test/huge.png', MAX_TEXTURE_SIDE)]);
  });

  it('falls back to the original src when the resolved URL fails to load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    setImageSrcResolver(resized);
    const src = 'https://cdn.test/a.png';
    broken.add(resized(src, MAX_TEXTURE_SIDE));
    await expect(decodeImage(src)).resolves.toBeDefined();
    expect(decoded).toEqual([resized(src, MAX_TEXTURE_SIDE), src]);
  });

  it('falls back to the original src when the resolver throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    setImageSrcResolver(() => {
      throw new Error('boom');
    });
    await decodeImage('https://cdn.test/b.png');
    expect(decoded).toEqual(['https://cdn.test/b.png']);
  });

  it('leaves data: URIs and SVG untouched', async () => {
    const resolver = vi.fn(resized);
    setImageSrcResolver(resolver);
    await decodeImage('data:image/png;base64,AAAA');
    await decodeImage('https://cdn.test/logo.svg');
    await decodeImage('data:image/svg+xml,<svg/>');
    expect(resolver).not.toHaveBeenCalled();
    expect(decoded).toEqual(['data:image/png;base64,AAAA', 'https://cdn.test/logo.svg', 'data:image/svg+xml,<svg/>']);
  });

  it('renders an image-url node from the resolved URL but keeps the original src in the document', async () => {
    setImageSrcResolver(resized);
    const src = 'https://cdn.test/doc-image.png';
    const doc = {
      version: 1,
      id: 'd',
      meta: { title: 't', createdAt: 0, updatedAt: 0 },
      pages: [],
      assets: { a: { type: 'image-url', src } },
    } as unknown as Document;
    const node = {
      id: 'i',
      type: 'image',
      assetId: 'a',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 20, height: 20 },
      opacity: 1,
      visible: true,
      locked: false,
    } as unknown as ImageNode;
    imageRenderer.create(node, doc);
    await loadsSettled();
    expect(decoded).toEqual([resized(src, MAX_TEXTURE_SIDE)]);
    expect(doc.assets.a).toEqual({ type: 'image-url', src });
  });
});
