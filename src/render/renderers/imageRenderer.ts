import { Assets, BlurFilter, Container, type Filter, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import type { Document, ImageNode, Node } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveAsset } from '../../services/assetResolver';
import { findNodeInPage } from '../../core/tree';
import { drawPath } from './shapeRenderer';
import { fillStyle } from './textRenderer';

// Tracks which assetId is currently loaded per sprite, so update() (called
// on every command touching this node, including drag/resize) only
// re-decodes the image when the assetId actually changes.
const loadedAssetId = new WeakMap<Sprite, string>();
// The mask child currently attached to a sprite (Phase 4 Pass B), so
// applyMask() can remove/destroy the previous one before rebuilding.
const maskChild = new WeakMap<Sprite, Container>();

function loadTexture(obj: Sprite, node: ImageNode, doc: Document): void {
  loadedAssetId.set(obj, node.assetId);
  const dataUri = resolveAsset(node.assetId, doc);
  Assets.load(dataUri)
    .then((texture: Texture) => {
      if (obj.destroyed) return;
      obj.texture = texture;
      applyCrop(obj, node);
    })
    .catch((err: unknown) => {
      // A broken/undecodable asset shouldn't crash the editor — leave the
      // sprite showing Texture.EMPTY (an empty placeholder).
      console.error(`Failed to load image asset ${node.assetId}:`, err);
    });
}

// node.crop is normalized (0..1 fractions of the source texture's pixel
// size), not raw pixels — the UI drag handles never need to know the
// texture's actual pixel dimensions, only the renderer does once a texture
// is loaded. Pixi's texture.frame is the native cropping mechanism (no
// custom geometry); re-applied on every update (and after a fresh texture
// load, since a new texture resets any prior frame).
function applyCrop(obj: Sprite, node: ImageNode): void {
  if (obj.texture === Texture.EMPTY) return;
  const { source } = obj.texture;
  const { frame } = obj.texture;
  const crop = node.crop;
  frame.x = crop ? crop.x * source.width : 0;
  frame.y = crop ? crop.y * source.height : 0;
  frame.width = crop ? crop.width * source.width : source.width;
  frame.height = crop ? crop.height * source.height : source.height;
  obj.texture.updateUvs();
}

// ImageNode.filters is a flat brightness/contrast/saturation/blur knob
// object, not the Effect[] union shapes/text use (src/schema/effect.ts) —
// deliberately different shapes for different purposes, so this doesn't
// reuse buildFilters.ts. AdjustmentFilter (pixi-filters) covers
// brightness/contrast/saturation in one filter; BlurFilter (pixi.js core)
// covers blur. Only include filters actually set, since AdjustmentFilter's
// defaults (1 = no change) would otherwise be overridden by `undefined`.
export function buildImageFilters(filters: ImageNode['filters']): Filter[] {
  if (!filters) return [];
  const list: Filter[] = [];
  const { brightness, contrast, saturation, blur } = filters;
  if (brightness !== undefined || contrast !== undefined || saturation !== undefined) {
    const opts: { brightness?: number; contrast?: number; saturation?: number } = {};
    if (brightness !== undefined) opts.brightness = brightness;
    if (contrast !== undefined) opts.contrast = contrast;
    if (saturation !== undefined) opts.saturation = saturation;
    list.push(new AdjustmentFilter(opts));
  }
  if (blur !== undefined) list.push(new BlurFilter({ strength: blur }));
  return list;
}

function findMaskRef(doc: Document, refId: string): Node | undefined {
  for (const page of doc.pages) {
    const location = findNodeInPage(page, refId);
    if (location) return location.node;
  }
  return undefined;
}

// A Pixi display object can only have one parent, so a mask-ref node (which
// stays a normal visible sibling elsewhere in the page) can't be reused
// directly as the mask — a duplicate silhouette is built instead, sized to
// the image's own bounds (not the ref node's original size/position), the
// same "drop a photo into a frame shape" convention Canva-style editors use.
function buildMaskChild(refNode: Node, size: { width: number; height: number }): Container | undefined {
  if (refNode.type === 'shape') {
    const g = new Graphics();
    drawPath(g, refNode, [0, 0]);
    g.fill('#ffffff');
    g.width = size.width;
    g.height = size.height;
    return g;
  }
  if (refNode.type === 'text') {
    const t = new Text({ text: refNode.text, style: fillStyle(refNode) });
    t.width = size.width;
    t.height = size.height;
    return t;
  }
  return undefined;
}

// Rebuilt from current doc state on every update() call — same "just
// redraw" approach stroke layers use — rather than tracking whether the
// ref'd node's own props changed.
function applyMask(obj: Sprite, node: ImageNode, doc: Document): void {
  const existing = maskChild.get(obj);
  if (existing) {
    obj.removeChild(existing);
    existing.destroy();
    maskChild.delete(obj);
    obj.mask = null;
  }
  if (!node.mask) return;
  const refNode = findMaskRef(doc, node.mask.ref);
  const child = refNode && buildMaskChild(refNode, node.size);
  if (!child) return;
  obj.addChild(child);
  obj.mask = child;
  maskChild.set(obj, child);
}

export const imageRenderer = {
  create(node: ImageNode, doc: Document): Sprite {
    const obj = new Sprite(Texture.EMPTY);
    loadTexture(obj, node, doc);
    this.update(obj, node, doc);
    return obj;
  },
  update(obj: Sprite, node: ImageNode, doc: Document): void {
    if (loadedAssetId.get(obj) !== node.assetId) {
      loadTexture(obj, node, doc);
    }
    obj.width = node.size.width;
    obj.height = node.size.height;
    applyCrop(obj, node);
    obj.filters = buildImageFilters(node.filters);
    applyMask(obj, node, doc);
    applyTransform(obj, node);
  },
};
