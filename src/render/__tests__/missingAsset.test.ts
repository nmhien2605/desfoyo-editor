// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Sprite, Texture, type Container } from 'pixi.js';
import { imageRenderer } from '../renderers/imageRenderer';
import { svgRenderer } from '../renderers/svgRenderer';
import type { Document, ImageNode, SvgNode } from '../../schema';

const base = {
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  size: { width: 20, height: 20 },
  opacity: 1,
  visible: true,
  locked: false,
};
const doc = { version: 1, id: 'd', meta: { title: 't', createdAt: 0, updatedAt: 0 }, pages: [], assets: {} } as unknown as Document;

describe('missing asset', () => {
  it('imageRenderer mounts an empty placeholder and warns instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const node = { ...base, id: 'i', type: 'image', assetId: 'gone' } as unknown as ImageNode;
    let wrapper: Container | undefined;
    expect(() => (wrapper = imageRenderer.create(node, doc))).not.toThrow();
    expect((wrapper!.children[0] as Sprite).texture).toBe(Texture.EMPTY);
    expect(() => imageRenderer.update(wrapper!, { ...node, opacity: 0.5 }, doc)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('svgRenderer mounts empty and warns instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const node = { ...base, id: 's', type: 'svg', assetId: 'gone' } as unknown as SvgNode;
    expect(() => svgRenderer.create(node, doc)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
