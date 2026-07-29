import { Assets, BlurFilter, Container, type Filter, Graphics, Sprite, Texture } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import type { Document, ImageNode, Node } from '../../schema';
import { applyTransform } from '../applyTransform';
import { buildFilters } from '../../effects/buildFilters';
import { resolveAsset } from '../../services/assetResolver';
import { findNodeInPage } from '../../core/tree';
import { drawPath } from './shapeRenderer';

// The display object is a wrapper Container (not a bare Sprite): the wrapper
// gets the ordinary applyTransform() treatment (position/rotation/pivot in
// node.size units, same as every other node type), while the actual pixel
// content is a Sprite child positioned/scaled *within* it to express
// node.crop — see applySizeAndCrop below for why this split is what makes
// cropping and the node's own transform compose correctly instead of
// fighting over the same obj.scale/obj.pivot.
function getSprite(wrapper: Container): Sprite {
  return wrapper.children[0] as Sprite;
}

// Tracks which assetId is currently loaded per sprite, so update() (called
// on every command touching this node, including drag/resize) only
// re-decodes the image when the assetId actually changes.
const loadedAssetId = new WeakMap<Sprite, string>();
// The mask child currently attached to a wrapper (Phase 4 Pass B), so
// applyMask() can remove/destroy the previous one before rebuilding.
const maskChild = new WeakMap<Container, Container>();

function loadTexture(sprite: Sprite, node: ImageNode, doc: Document): void {
  loadedAssetId.set(sprite, node.assetId);
  const dataUri = resolveAsset(node.assetId, doc);
  Assets.load(dataUri)
    .then((texture: Texture) => {
      if (sprite.destroyed) return;
      sprite.texture = texture;
      applyCrop(sprite, node);
      applySizeAndCrop(sprite, node);
    })
    .catch((err: unknown) => {
      // A broken/undecodable asset shouldn't crash the editor — leave the
      // sprite showing Texture.EMPTY (an empty placeholder).
      console.error(`Failed to load image asset ${node.assetId}:`, err);
    });
}

// node.crop is normalized 0..1 fractions of the source image's own raw
// pixel size, stored as an absolute rect against that *original* size no
// matter how many times it's been dragged (see ImageCropHandles/
// updateCropHandle in SelectionOverlay.tsx) — so `source.width/height`
// (the underlying, never-mutated image resource) is what these fractions
// must be multiplied against, not `frame`/`orig` (Pixi aliases `orig` to
// `frame` for a plain non-atlas texture, so both shrink the moment this
// function mutates `frame` — neither is a stable "original size" reference
// once cropped). Pixi's texture.frame is the native cropping mechanism (no
// custom geometry); re-applied on every update (and after a fresh texture
// load, since a new texture resets any prior frame).
// `updateUvs()` only refreshes which pixels get *sampled* — the Sprite's
// own render geometry (its quad, sized from `texture.orig`) is cached and
// normally only recomputed when `sprite.texture` is *reassigned*: Sprite's
// texture setter subscribes to the texture's 'update' event, but only for
// `dynamic` textures (video etc.), so mutating a plain static texture's
// `frame` in place — exactly what this function does — never fires that
// event. `onViewUpdate()` is the same public "recompute my geometry" hook
// Pixi's own texture setter calls; without it the quad silently keeps
// rendering at its pre-crop size even though the UVs (and node.crop data)
// are already correct.
function applyCrop(sprite: Sprite, node: ImageNode): void {
  if (sprite.texture === Texture.EMPTY) return;
  const { source } = sprite.texture;
  const { frame } = sprite.texture;
  const crop = node.crop;
  frame.x = crop ? crop.x * source.width : 0;
  frame.y = crop ? crop.y * source.height : 0;
  frame.width = crop ? crop.width * source.width : source.width;
  frame.height = crop ? crop.height * source.height : source.height;
  sprite.texture.updateUvs();
  // onViewUpdate() is `protected` in Pixi's own .d.ts (an internal-facing
  // API), but it's the exact same public-in-practice hook Pixi's own
  // texture setter calls above — there's no other supported way to tell a
  // Sprite "the texture you already have just changed shape".
  (sprite as unknown as { onViewUpdate(): void }).onViewUpdate();
}

// ImageNode.filters is a flat brightness/contrast/saturation/blur knob
// object, not the Effect[] union shapes use (src/schema/effect.ts) —
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

// Positions/scales the inner Sprite *within* the wrapper (whose own
// transform — including transform.scaleX/Y — is applied separately by
// applyTransform on the wrapper, and composes automatically through normal
// Pixi parent/child transform nesting, so it isn't folded in again here).
// scale is fixed to node.size / the raw source image's pixel size — using
// `source` rather than the crop-shrunk `frame`/`orig` keeps this constant
// across crops, so cropping shrinks/repositions the visible sub-image
// *within* the same node.size box instead of re-zooming to refill it every
// time (matches the crop rectangle preview ImageCropHandles draws, which
// shrinks in place, not the whole box). Position offsets the sprite by
// crop.x/y in that same node.size-unit space, so the remaining visible
// sub-image lands where the crop rectangle was dragged to. Because the
// wrapper's own pivot (set by applyTransform, in node.size units) and the
// sprite's position (also in node.size units, set here) now share one
// coordinate system, no separate pivot override is needed on the sprite
// itself — unlike a bare Sprite, whose own local space is tied to its
// texture's (mutable, crop-shrunk) size.
function applySizeAndCrop(sprite: Sprite, node: ImageNode): void {
  if (sprite.texture === Texture.EMPTY) return;
  const { width: sourceWidth, height: sourceHeight } = sprite.texture.source;
  if (sourceWidth === 0 || sourceHeight === 0) return;
  sprite.scale.set(node.size.width / sourceWidth, node.size.height / sourceHeight);
  const crop = node.crop;
  sprite.position.set((crop?.x ?? 0) * node.size.width, (crop?.y ?? 0) * node.size.height);
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
  return undefined;
}

// Attached to the wrapper (not the inner sprite) so the mask clips the
// whole node.size box regardless of where node.crop currently positions
// the visible sub-image within it. Rebuilt from current doc state on every
// update() call — same "just redraw" approach stroke layers use — rather
// than tracking whether the ref'd node's own props changed.
function applyMask(wrapper: Container, node: ImageNode, doc: Document): void {
  const existing = maskChild.get(wrapper);
  if (existing) {
    wrapper.removeChild(existing);
    existing.destroy();
    maskChild.delete(wrapper);
    wrapper.mask = null;
  }
  if (!node.mask) return;
  const refNode = findMaskRef(doc, node.mask.ref);
  const child = refNode && buildMaskChild(refNode, node.size);
  if (!child) return;
  wrapper.addChild(child);
  wrapper.mask = child;
  maskChild.set(wrapper, child);
}

export const imageRenderer = {
  create(node: ImageNode, doc: Document): Container {
    const wrapper = new Container();
    const sprite = new Sprite(Texture.EMPTY);
    wrapper.addChild(sprite);
    loadTexture(sprite, node, doc);
    this.update(wrapper, node, doc);
    return wrapper;
  },
  update(wrapper: Container, node: ImageNode, doc: Document): void {
    const sprite = getSprite(wrapper);
    if (loadedAssetId.get(sprite) !== node.assetId) {
      loadTexture(sprite, node, doc);
    }
    applyCrop(sprite, node);
    applyMask(wrapper, node, doc);
    applyTransform(wrapper, node);
    // applyTransform just set wrapper.filters from node.effects (the
    // generic shadow/glow/outline/blur/extrude3d/custom union every node
    // type can have) — combined here with ImageNode.filters' separate flat
    // brightness/contrast/saturation/blur knobs instead of one clobbering
    // the other.
    wrapper.filters = [...buildFilters(node.effects), ...buildImageFilters(node.filters)];
    applySizeAndCrop(sprite, node);
  },
};
