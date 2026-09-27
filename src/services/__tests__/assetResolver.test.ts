import { describe, expect, it } from 'vitest';
import { resolveAsset } from '../assetResolver';
import type { Document } from '../../schema';

function docWithAssets(): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
    pages: [],
    assets: {
      img: { type: 'image', dataUri: 'data:image/png;base64,abc' },
      svg: { type: 'svg', dataUri: '<svg/>' },
      remote: { type: 'image-url', src: 'https://cdn.example.com/photo.png' },
    },
  };
}

describe('resolveAsset', () => {
  const doc = docWithAssets();

  it('returns dataUri for embedded image assets', () => {
    expect(resolveAsset('img', doc)).toBe('data:image/png;base64,abc');
  });

  it('returns dataUri for embedded svg assets', () => {
    expect(resolveAsset('svg', doc)).toBe('<svg/>');
  });

  it('returns src for image-url assets', () => {
    expect(resolveAsset('remote', doc)).toBe('https://cdn.example.com/photo.png');
  });

  it('throws for an unknown assetId', () => {
    expect(() => resolveAsset('missing', doc)).toThrow('Unknown assetId: missing');
  });
});
