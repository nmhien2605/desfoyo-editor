import { CanvasTextMetrics, TextStyle, type Application, type Container } from 'pixi.js';
import type { Document, Page, TextNode } from '../schema';
import type { SceneReconciler } from '../render/SceneReconciler';
import { walkTree } from '../core/tree';
import { serializeNode, type RasterizedMap, type VectorTextMap } from './svgSerializer';
import { getFont } from './fontService';
import { layoutText } from '../text/glyphOutline';
import { fillStyle } from '../render/renderers/textRenderer';

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

// Walks the page for 'text'/'svg' nodes (the two types svgSerializer.ts's
// serializeNode rasterizes rather than serializing as real vector markup —
// see svgSerializer.ts's RasterizedMap doc comment for why) and extracts
// each one's live (post-effects) Pixi render via the same
// renderer.extract mechanism exportPng already uses, targeting the exact
// display object SceneReconciler.getDisplayObject(nodeId) already tracks.
// `skipIds` (Phase 3 opentype gate, Pass B) excludes text nodes that already
// vectorized via computeVectorTextMap below — 'svg' nodes and any
// non-vectorized text node still rasterize as before.
async function rasterizeTextAndSvgNodes(app: Application, page: Page, reconciler: SceneReconciler, skipIds?: Set<string>): Promise<RasterizedMap> {
  const map: RasterizedMap = {};
  const pending: Promise<void>[] = [];
  walkTree(page.children, (node) => {
    if (node.type !== 'text' && node.type !== 'svg') return;
    if (skipIds?.has(node.id)) return;
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

// Resolves a text node's font asset dataUri (upload) from doc.assets, or
// undefined for a default family (getFont then fetches it — see
// fontService.ts). Assets are keyed by assetId, not family, so this is a
// linear scan — documents have few font assets, not worth an index.
function findFontDataUri(doc: Document, family: string): string | undefined {
  for (const asset of Object.values(doc.assets)) {
    if (asset.type === 'font' && asset.family === family) return asset.dataUri;
  }
  return undefined;
}

// Builds a TextStyle matching how textRenderer.ts renders this node flatly
// (fillStyle), plus the wrap parameters PIXI.Text itself would use — needed
// only for the wrap-correctness cross-check below, never for rendering.
function measurementStyle(node: TextNode): TextStyle {
  return new TextStyle({ ...fillStyle(node), wordWrap: true, wordWrapWidth: node.size.width, breakWords: true });
}

// Phase 3 opentype gate, Pass B: precomputes glyph-outline layouts for text
// nodes that can be vectorized — WOFF2/unparseable font, unsupported
// script, or a word-wrap mismatch against PIXI's own Canvas 2D measurement
// all fall through to `undefined` (raster fallback), never a thrown error.
// Runs before rasterizeTextAndSvgNodes so its keys can be excluded from
// rasterization. See plan/phases/phase-3-glyph-outline-opentype.md §Pass B.
export async function computeVectorTextMap(page: Page, doc: Document): Promise<VectorTextMap> {
  const map: VectorTextMap = {};
  const pending: Promise<void>[] = [];

  walkTree(page.children, (node) => {
    if (node.type !== 'text') return;
    const textNode = node;
    pending.push(
      (async () => {
        const dataUri = findFontDataUri(doc, textNode.font.family);
        const font = await getFont(textNode.font.family, dataUri);
        if (!font) return;

        const layout = layoutText(textNode, font);
        if (!layout) return;

        const pixiLines = CanvasTextMetrics.measureText(textNode.text, measurementStyle(textNode)).lines.length;
        if (pixiLines !== layout.lines.length) return;

        map[textNode.id] = layout;
      })(),
    );
  });

  await Promise.all(pending);
  return map;
}

// Vector SVG export (Phase 4 Pass E, extended by Phase 3's opentype gate
// Pass B) — shape/image nodes serialize as real SVG elements; text nodes
// that vectorize via computeVectorTextMap serialize as real <path> glyph
// outlines; everything else (svg nodes, and text nodes that couldn't
// vectorize) is rasterized and embedded (see rasterizeTextAndSvgNodes
// above). Returns a plain string, not a Blob, so callers decide how to
// package it — Editor.tsx wraps it as a `Blob([svg], {type:'image/svg+xml'})`
// to match exportPng's return shape.
export async function exportSvg(app: Application, page: Page, doc: Document, reconciler: SceneReconciler): Promise<string> {
  const vectorText = await computeVectorTextMap(page, doc);
  const rasterized = await rasterizeTextAndSvgNodes(app, page, reconciler, new Set(Object.keys(vectorText)));
  const defs: string[] = [];
  const body = page.children.map((node) => serializeNode(node, doc, defs, rasterized, vectorText)).join('');
  const defsBlock = defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.size.width} ${page.size.height}" width="${page.size.width}" height="${page.size.height}">${defsBlock}${body}</svg>`;
}
