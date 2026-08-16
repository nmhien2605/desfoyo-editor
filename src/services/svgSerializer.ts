import type { Document, Fill, GroupNode, Node, ShapeNode, TextNode } from '../schema';
import { resolveAsset } from './assetResolver';
import { getLoadedFont } from '../text/fontService';
import { textGeometry } from '../text/textGeometry';
import type { GlyphShape } from '../text/glyphOutlines';

// nodeId -> data:image/png;base64,... , built by the caller (exportService
// .ts's exportSvg) via Pixi's live-render extract, since this module is
// pure and has no access to the running renderer. Used for 'svg' nodes:
// re-embedding the original markup as a scaled nested <svg> would need
// re-parsing its viewBox and reconciling it with node.size — instead this
// rasterizes via extract, a ponytail-scoped simplification (imported SVGs
// stay vector *on canvas*, just not in a re-exported SVG). Revisit with true
// nested-<svg> embedding if a real need for re-exportable vector icons shows up.
export type RasterizedMap = Record<string, string>;

let gradientCounter = 0;

// Emits a <linearGradient>/<radialGradient> into `defs` and returns a
// `fill="url(#id)"` attribute. Solid fills just return `fill="#hex"`
// directly, no defs needed. 'texture' fills have no SVG pattern-fill
// mapping in v1 — ponytail-scoped simplification, falls back to a neutral
// gray rather than attempting a <pattern> translation.
function fillAttr(fill: Fill, defs: string[]): string {
  if (fill.type === 'solid') {
    const opacity = fill.alpha !== undefined ? ` fill-opacity="${fill.alpha}"` : '';
    return `fill="${fill.color}"${opacity}`;
  }
  if (fill.type === 'texture') return 'fill="#888888"';

  const id = `grad-${gradientCounter++}`;
  const stops = fill.stops
    .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"${s.alpha !== undefined ? ` stop-opacity="${s.alpha}"` : ''}/>`)
    .join('');
  if (fill.type === 'linear-gradient') {
    const rad = fill.angle;
    const x2 = 0.5 + Math.cos(rad) * 0.5;
    const y2 = 0.5 + Math.sin(rad) * 0.5;
    const x1 = 0.5 - Math.cos(rad) * 0.5;
    const y1 = 0.5 - Math.sin(rad) * 0.5;
    defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`);
  } else {
    defs.push(`<radialGradient id="${id}">${stops}</radialGradient>`);
  }
  return `fill="url(#${id})"`;
}

// Alternating outer/inner vertices — matches the general "star" convention;
// not guaranteed pixel-identical to Pixi's own Graphics.star() geometry,
// which isn't part of its public/documented API surface.
function starPoints(cx: number, cy: number, points: number, outerRadius: number): string {
  const innerRadius = outerRadius / 2;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return coords.join(' ');
}

// Same 5-case shape switch as shapeRenderer.ts's drawPath, reimplemented as
// SVG attribute strings instead of Pixi Graphics calls (no serializer to
// reuse from — Pixi's Graphics has no "export back to SVG" capability).
// 'path' stays a bbox stand-in, same stub shapeRenderer.ts already uses
// (arbitrary SVG path data isn't parsed anywhere in this codebase yet).
function shapeElement(node: ShapeNode, defs: string[]): string {
  const { width, height } = node.size;
  const fill = fillAttr(node.fill, defs);
  switch (node.shape) {
    case 'rect':
      return node.cornerRadius
        ? `<rect width="${width}" height="${height}" rx="${node.cornerRadius}" ${fill}/>`
        : `<rect width="${width}" height="${height}" ${fill}/>`;
    case 'ellipse':
      return `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" ${fill}/>`;
    case 'polygon': {
      const points = node.points ?? [0, 0, width, 0, width / 2, height];
      const attr = points.reduce<string[]>((acc, v, i) => {
        if (i % 2 === 0) acc.push(`${v}`);
        else acc[acc.length - 1] += `,${v}`;
        return acc;
      }, []);
      return `<polygon points="${attr.join(' ')}" ${fill}/>`;
    }
    case 'star':
      return `<polygon points="${starPoints(width / 2, height / 2, 5, Math.min(width, height) / 2)}" ${fill}/>`;
    case 'line':
      return `<line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${node.fill.type === 'solid' ? node.fill.color : '#000000'}"/>`;
    case 'path':
      return `<rect width="${width}" height="${height}" ${fill}/>`;
  }
}

// translate(x,y) rotate(deg) scale(sx,sy) translate(-pivotX,-pivotY) — same
// convention applyTransform.ts's Pixi pivot/position math uses (SVG's
// transform list applies right-to-left to a point, matching Pixi's own
// pivot-then-scale-then-rotate-then-translate order). Skew isn't mapped —
// rare in practice, ponytail-scoped out.
function transformAttr(node: Node): string {
  const { transform, size } = node;
  const originX = transform.originX ?? 0;
  const originY = transform.originY ?? 0;
  const px = originX * size.width;
  const py = originY * size.height;
  const deg = (transform.rotation * 180) / Math.PI;
  return `translate(${transform.x} ${transform.y}) rotate(${deg}) scale(${transform.scaleX} ${transform.scaleY}) translate(${-px} ${-py})`;
}

function groupAttrs(node: Node): string {
  const opacity = node.opacity !== 1 ? ` opacity="${node.opacity}"` : '';
  const blend = node.blendMode && node.blendMode !== 'normal' ? ` style="mix-blend-mode:${node.blendMode}"` : '';
  return ` transform="${transformAttr(node)}"${opacity}${blend}`;
}

function contourToPathData(contour: number[]): string {
  const parts: string[] = [`M ${contour[0]} ${contour[1]}`];
  for (let i = 2; i < contour.length; i += 2) parts.push(`L ${contour[i]} ${contour[i + 1]}`);
  parts.push('Z');
  return parts.join(' ');
}

// Text xuất ra vector thật (khác 'svg' node vốn phải rasterize) vì contour đã
// có sẵn từ textGeometry — không cần nhúng font, không cần <text>. Lỗ đi kèm
// outer trong cùng một `d` và để SVG tự cắt bằng fill-rule="evenodd".
function textElement(node: TextNode, defs: string[]): string {
  const loaded = getLoadedFont(node.font.family);
  // Font chưa nạp thì bỏ qua node, cùng quy ước "thiếu dữ liệu thì im lặng"
  // mà nhánh 'svg' phía dưới dùng khi thiếu bản rasterize.
  if (!loaded) return '';
  const shapes: GlyphShape[] = textGeometry(node, loaded.font).shapes;
  if (shapes.length === 0) return '';
  const data = shapes
    .map((shape) => [shape.outer, ...shape.holes].map(contourToPathData).join(' '))
    .join(' ');
  return `<path d="${data}" fill-rule="evenodd" ${fillAttr(node.fill, defs)}/>`;
}

export function serializeNode(node: Node, doc: Document, defs: string[], rasterized?: RasterizedMap): string {
  if (!node.visible) return '';

  if (node.type === 'svg') {
    const href = rasterized?.[node.id];
    if (!href) return '';
    return `<image${groupAttrs(node)} width="${node.size.width}" height="${node.size.height}" href="${href}"/>`;
  }
  if (node.type === 'image') {
    // v1 exports the source image as-is — crop/mask/filters (Phase 4 Pass B)
    // have no SVG <clipPath>/CSS-filter mapping yet, ponytail-scoped out.
    const href = resolveAsset(node.assetId, doc);
    return `<image${groupAttrs(node)} width="${node.size.width}" height="${node.size.height}" href="${href}"/>`;
  }
  if (node.type === 'text') {
    const element = textElement(node, defs);
    return element ? `<g${groupAttrs(node)}>${element}</g>` : '';
  }
  if (node.type === 'group') {
    const group = node as GroupNode;
    const children = group.children.map((c) => serializeNode(c, doc, defs, rasterized)).join('');
    return `<g${groupAttrs(node)}>${children}</g>`;
  }
  return `<g${groupAttrs(node)}>${shapeElement(node, defs)}</g>`;
}
