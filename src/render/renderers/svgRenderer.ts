import { Graphics } from 'pixi.js';
import type { Document, Fill, SvgNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveAsset } from '../../services/assetResolver';

// asset.dataUri is an uploaded-file data URI (base64 or plain) holding raw
// SVG markup — fetch() decodes either form back to text in one line, no
// manual base64/mimetype parsing needed.
export async function decodeSvgText(dataUri: string): Promise<string> {
  const response = await fetch(dataUri);
  return response.text();
}

// v1 only applies solid-color overrides — gradient overrides are declared
// in the schema (SvgNodeSchema.overrides: Record<string, Fill>) to match
// docs/04-data-model.md, but silently ignored here, same convention
// buildFilters.ts's unknown 'custom' shaderId already uses. Unknown ids
// (no matching element) are also silently no-ops.
export function applyOverrides(svgText: string, overrides: Record<string, Fill> | undefined): string {
  if (!overrides || Object.keys(overrides).length === 0) return svgText;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  for (const [id, fill] of Object.entries(overrides)) {
    if (fill.type !== 'solid') continue;
    doc.getElementById(id)?.setAttribute('fill', fill.color);
  }
  return new XMLSerializer().serializeToString(doc);
}

// Every element with a non-empty `id` and a fill-able tag — used by
// PropertiesPanel's recoloring UI to list which ids can be targeted by
// `overrides`. Not scoped to elements that already have an explicit `fill`
// attribute, since an unset fill still inherits/paints (SVG default fill is
// black) and is still a valid override target.
const FILLABLE_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']);

export function listFillableIds(svgText: string): string[] {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const ids: string[] = [];
  for (const el of doc.querySelectorAll('[id]')) {
    if (FILLABLE_TAGS.has(el.tagName.toLowerCase()) && el.id) ids.push(el.id);
  }
  return ids;
}

// Graphics.width/height setters (and applyTransform's obj.scale.set) both
// write to the same obj.scale — whichever runs last wins, so calling
// applyTransform (needed for position/rotation/filters/etc.) after setting
// width/height would silently wipe out the size-driven scale. This runs
// *after* applyTransform instead and derives the final scale itself:
// (node.size / the raw drawn SVG's own bounds) folded together with
// transform.scaleX/Y, so resizing (node.size) and any future transform-level
// scale compose instead of one clobbering the other. Pivot is likewise
// recomputed in the drawn geometry's own local-bounds units (not node.size
// units, which only equal local units for shapeRenderer.ts's shapes, drawn
// directly at size — an SVG's viewBox can be any native size, and can start
// at a non-zero x/y, hence the `bounds.x +`/`bounds.y +` offset below).
function applySizeAndOrigin(obj: Graphics, node: SvgNode): void {
  const bounds = obj.getLocalBounds();
  if (bounds.width === 0 || bounds.height === 0) return;
  obj.scale.set((node.size.width / bounds.width) * node.transform.scaleX, (node.size.height / bounds.height) * node.transform.scaleY);
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  obj.pivot.set(bounds.x + originX * bounds.width, bounds.y + originY * bounds.height);
}

// SVG parsing/rendering is fully async (decodeSvgText fetches the data URI),
// but SceneReconciler's create()/update() are synchronous — create() starts
// as an empty Graphics and fills in once the async build resolves, same
// "start empty, fill in later" shape imageRenderer.ts's texture loading
// already uses. update() always clears and rebuilds rather than diffing,
// same "just redraw" approach shapeRenderer.ts/stroke layers use.
export const svgRenderer = {
  create(node: SvgNode, doc: Document): Graphics {
    const obj = new Graphics();
    this.update(obj, node, doc);
    return obj;
  },
  update(obj: Graphics, node: SvgNode, doc: Document): void {
    void decodeSvgText(resolveAsset(node.assetId, doc)).then((svgText) => {
      if (obj.destroyed) return;
      obj.clear();
      obj.svg(applyOverrides(svgText, node.overrides));
      applyTransform(obj, node);
      applySizeAndOrigin(obj, node);
    });
    applyTransform(obj, node);
  },
};
