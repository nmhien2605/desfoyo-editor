import { BlurFilter, Container, type Filter, Graphics, Sprite, Texture } from 'pixi.js';
import { AdjustmentFilter } from 'pixi-filters';
import type { Document, ImageNode, Node } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveAsset } from '../../services/assetResolver';
import { findNodeInPage } from '../../core/tree';
import { drawPath } from './shapeRenderer';
import { trackLoad } from '../pendingLoads';

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

const SVG_SRC = /^data:image\/svg\+xml|\.svg([?#]|$)/i;
const SVG_RASTER_SCALE = 2;
// shortcut: 2048 keeps a 4-side editor inside a phone's GPU budget, but a
// photo shown bigger than 2048 px on screen (deep zoom) gets soft; raise it
// (or pick it per device) if hosts zoom far into large photos.
export const MAX_TEXTURE_SIDE = 2048;

// Raster size for a decoded image: SVG at 2× natural, bitmaps at natural,
// both scaled uniformly so the longest side ≤ MAX_TEXTURE_SIDE. Uniform, so
// node.crop fractions of source.width/height stay valid.
export function rasterSize(width: number, height: number, svg: boolean): { width: number; height: number } {
  const k = Math.min(svg ? SVG_RASTER_SCALE : 1, MAX_TEXTURE_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

// Decodes through an <img> rather than Pixi Assets: Assets picks a parser
// from the URL extension (extension-less CDN/blob: URLs fail) and its
// texture parser uses createImageBitmap, which rejects SVG. SVG is drawn to a
// canvas at 2× its natural size so it stays sharp when the node is scaled up;
// anything over MAX_TEXTURE_SIDE is drawn down to it the same way.
// Mipmaps on: sources are often ~2000 px drawn at a few hundred px, and plain
// linear sampling at that ratio skips thin strokes (they render dotted).
export async function decodeImage(src: string): Promise<Texture> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const svg = SVG_SRC.test(src);
  // An SVG without width/height has no natural size in some browsers.
  const w = img.naturalWidth || (svg ? 512 : 0);
  const h = img.naturalHeight || (svg ? 512 : 0);
  const size = rasterSize(w, h, svg);
  if (!svg && size.width === w && size.height === h) return withMipmaps(Texture.from(img));
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return withMipmaps(Texture.from(canvas));
}

function withMipmaps(texture: Texture): Texture {
  texture.source.autoGenerateMipmaps = true;
  return texture;
}

// One decode per src, shared by every sprite and stage backdrop (all editors
// on the page) using it. Refcounted: the last release destroys the source.
const textureCache = new Map<string, { texture: Promise<Texture>; refs: number }>();

export function acquireImage(src: string): Promise<Texture> {
  let entry = textureCache.get(src);
  if (!entry) {
    const created = { texture: decodeImage(src), refs: 0 };
    created.texture.catch(() => {
      if (textureCache.get(src) === created) textureCache.delete(src); // allow a retry
    });
    textureCache.set(src, created);
    entry = created;
  }
  entry.refs++;
  return entry.texture;
}

export function releaseImage(src: string): void {
  const entry = textureCache.get(src);
  if (!entry) return;
  entry.refs--;
  // Destroyed only once the decode settles, a microtask later at the earliest:
  // remountPage (undo/redo) releases then re-acquires synchronously, and must
  // keep the decode instead of paying for it again.
  entry.texture
    .then((texture) => {
      if (entry.refs > 0 || textureCache.get(src) !== entry) return;
      textureCache.delete(src);
      texture.destroy(true);
    })
    .catch(() => {});
}

/** Number of cached decodes (tests/diagnostics). */
export function cachedImageCount(): number {
  return textureCache.size;
}

// src each sprite currently holds a reference on (released on asset change / destroy).
const acquiredSrc = new WeakMap<Sprite, string>();

function releaseSprite(sprite: Sprite): void {
  const src = acquiredSrc.get(sprite);
  if (src === undefined) return;
  acquiredSrc.delete(sprite);
  releaseImage(src);
}

function loadTexture(sprite: Sprite, node: ImageNode, doc: Document): void {
  loadedAssetId.set(sprite, node.assetId);
  let src: string;
  try {
    src = resolveAsset(node.assetId, doc);
  } catch (err) {
    // Missing asset must not throw out of mount/remount: empty placeholder (not retried until assetId changes).
    console.warn(`Image asset ${node.assetId} unavailable:`, err);
    releaseSprite(sprite);
    if (sprite.texture !== Texture.EMPTY) {
      sprite.texture.destroy();
      sprite.texture = Texture.EMPTY;
    }
    return;
  }
  releaseSprite(sprite);
  acquiredSrc.set(sprite, src);
  trackLoad(
    acquireImage(src)
      .then((texture: Texture) => {
        // Destroyed, or switched to another asset while this one decoded.
        if (sprite.destroyed || acquiredSrc.get(sprite) !== src) return;
        // Own Texture per sprite over the shared source: applyCrop mutates
        // texture.frame, which must not leak to other nodes using this asset.
        const old = sprite.texture;
        sprite.texture = new Texture({ source: texture.source });
        if (old !== Texture.EMPTY) old.destroy();
        applyCrop(sprite, node);
        applySizeAndCrop(sprite, node);
      })
      .catch((err: unknown) => {
        // A broken/undecodable asset shouldn't crash the editor — leave the
        // sprite showing Texture.EMPTY (an empty placeholder).
        console.error(`Failed to load image asset ${node.assetId}:`, err);
      }),
  );
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
    // Fires before Sprite.destroy drops its texture: free the sprite's own
    // Texture (not the shared source) and its cache reference.
    sprite.once('destroyed', () => {
      releaseSprite(sprite);
      if (sprite.texture !== Texture.EMPTY) sprite.texture.destroy();
    });
    // SceneReconciler.destroy destroys the wrapper without its children.
    wrapper.once('destroyed', () => {
      if (!sprite.destroyed) sprite.destroy();
      maskChild.get(wrapper)?.destroy();
    });
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
    // node.effects' filters plus ImageNode.filters' separate flat
    // brightness/contrast/saturation/blur knobs, combined instead of one
    // clobbering the other.
    applyTransform(wrapper, node, { key: node.filters, build: () => buildImageFilters(node.filters) });
    applySizeAndCrop(sprite, node);
  },
};
