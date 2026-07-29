import type { Application, Container } from 'pixi.js';
import type { Document, Page } from '../schema';
import type { SceneReconciler } from '../render/SceneReconciler';
import { walkTree } from '../core/tree';
import { serializeNode, type RasterizedMap } from './svgSerializer';

// Extracts the page container specifically (not app.stage), so any future
// selection/UI chrome doesn't leak into the exported image.
export function exportPng(app: Application, pageContainer: Container): Promise<Blob> {
  const canvas = app.renderer.extract.canvas({ target: pageContainer }) as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export PNG'));
    }, 'image/png');
  });
}

// Walks the page for 'svg' nodes (the type svgSerializer.ts's serializeNode
// rasterizes rather than serializing as real vector markup — see
// svgSerializer.ts's RasterizedMap doc comment for why) and extracts each
// one's live (post-effects) Pixi render via the same renderer.extract
// mechanism exportPng already uses, targeting the exact display object
// SceneReconciler.getDisplayObject(nodeId) already tracks.
async function rasterizeTextAndSvgNodes(app: Application, page: Page, reconciler: SceneReconciler): Promise<RasterizedMap> {
  const map: RasterizedMap = {};
  const pending: Promise<void>[] = [];
  walkTree(page.children, (node) => {
    if (node.type !== 'svg') return;
    const obj = reconciler.getDisplayObject(node.id);
    if (!obj) return;
    pending.push(
      app.renderer.extract.base64({ target: obj }).then((href) => {
        map[node.id] = href;
      }),
    );
  });
  await Promise.all(pending);
  return map;
}

// Vector SVG export (Phase 4 Pass E) — shape/image nodes serialize as real
// SVG elements; svg nodes are rasterized and embedded (see
// rasterizeTextAndSvgNodes above). Returns a plain string, not a Blob, so
// callers decide how to package it — Editor.tsx wraps it as a
// `Blob([svg], {type:'image/svg+xml'})` to match exportPng's return shape.
export async function exportSvg(app: Application, page: Page, doc: Document, reconciler: SceneReconciler): Promise<string> {
  const rasterized = await rasterizeTextAndSvgNodes(app, page, reconciler);
  const defs: string[] = [];
  const body = page.children.map((node) => serializeNode(node, doc, defs, rasterized)).join('');
  const defsBlock = defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.size.width} ${page.size.height}" width="${page.size.width}" height="${page.size.height}">${defsBlock}${body}</svg>`;
}
