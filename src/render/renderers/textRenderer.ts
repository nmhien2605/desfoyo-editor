import { Container, Mesh, MeshGeometry, Text, type TextStyleFontWeight, type Texture } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill, strokeColorFields } from '../fillToColor';
import { getRenderer } from '../rendererContext';
import { computeWarpGrid, type WarpType } from '../../text/warpGeometry';

const MESH_WARP_TYPES: WarpType[] = ['arc', 'wave', 'bulge', 'flag', 'perspective'];

function toFontWeight(weight: number): TextStyleFontWeight {
  const clamped = Math.min(900, Math.max(100, Math.round(weight / 100) * 100));
  return String(clamped) as TextStyleFontWeight;
}

function baseStyle(node: TextNode) {
  return {
    fontFamily: node.font.family,
    fontSize: node.font.size,
    fontWeight: toFontWeight(node.font.weight),
    fontStyle: node.font.style,
    align: node.align,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
  };
}

function fillStyle(node: TextNode) {
  return { ...baseStyle(node), fill: resolveFill(node.fill) };
}

// Invisible fill + a stroke — Pixi Text has no native multi-layer stroke, so
// each layer is rendered as a separate stroke-only Text clone positioned at
// its own offset, stacked behind the true filled text on top. Mirrors
// shapeRenderer.ts's layered-stroke approach.
function strokeLayerStyle(node: TextNode, layer: { width: number; fill: TextNode['fill'] }) {
  return { ...baseStyle(node), fill: { color: '#000000', alpha: 0 }, stroke: { width: layer.width, ...strokeColorFields(layer.fill) } };
}

function updateLayeredText(container: Container, node: TextNode): void {
  const layers = node.stroke?.layers ?? (node.stroke ? [{ width: node.stroke.width, fill: node.stroke.fill, offset: undefined }] : []);

  // Rebuild children only when the layer count changes (an explicit +/-
  // layer edit) — keeps drag/resize smooth by updating existing Text
  // objects in place otherwise, instead of destroying/recreating every
  // frame of a gesture.
  if (container.children.length !== layers.length + 1) {
    container.removeChildren().forEach((c) => c.destroy());
    for (const layer of layers) container.addChild(new Text({ text: node.text, style: strokeLayerStyle(node, layer) }));
    container.addChild(new Text({ text: node.text, style: fillStyle(node) }));
  }

  layers.forEach((layer, i) => {
    const child = container.children[i] as Text;
    child.text = node.text;
    Object.assign(child.style, strokeLayerStyle(node, layer));
    const [dx, dy] = layer.offset ?? [0, 0];
    child.position.set(dx, dy);
  });

  const fillChild = container.children[layers.length] as Text;
  fillChild.text = node.text;
  Object.assign(fillChild.style, fillStyle(node));
  fillChild.position.set(0, 0);
}

// The plain (unwarped, untransformed) visual — a bare Text for the common
// case, or a Container of layered-stroke Text clones. NOT transform-applied:
// when this is used as a warp rasterization source, applying the node's real
// transform first would double up (once in the raster, once on the Mesh
// wrapping it), so callers that use this directly (no warp) apply transform
// themselves.
function buildFlatVisual(node: TextNode): Text | Container {
  if (!node.stroke) return new Text({ text: node.text, style: fillStyle(node) });
  const container = new Container();
  updateLayeredText(container, node);
  return container;
}

// Exported so SceneReconciler.ts's needsRecreate() can detect the
// Text|Container ↔ Mesh identity swap the same way it already detects the
// Text ↔ Container (stroke) swap from Pass A.
export function wantsMesh(node: TextNode): boolean {
  return !!node.warp && (MESH_WARP_TYPES as string[]).includes(node.warp.type) && !!getRenderer();
}

// What a Mesh's rasterized texture needs to be regenerated for — anything
// that changes the *flat* rendering (not warp type/intensity, which only
// needs the vertex grid recomputed).
function rasterizationKey(node: TextNode): string {
  return JSON.stringify({ text: node.text, font: node.font, align: node.align, letterSpacing: node.letterSpacing, lineHeight: node.lineHeight, fill: node.fill, stroke: node.stroke });
}

const meshContentKey = new WeakMap<Mesh, string>();
// Row count (and therefore vertex/uv/index layout) differs per warp type
// (see ROWS in warpGeometry.ts) — a type change needs a full MeshGeometry
// rebuild, not just a positions reassignment, or the position buffer's new
// vertex count desyncs from the still-stale uvs/indices buffers.
const meshWarpType = new WeakMap<Mesh, WarpType>();

function buildWarpedMesh(node: TextNode): Mesh {
  const renderer = getRenderer();
  if (!renderer) throw new Error('buildWarpedMesh called without an active renderer');

  const flat = buildFlatVisual(node);
  const texture = renderer.generateTexture(flat);
  flat.destroy();

  const mesh = new Mesh({ geometry: buildGeometry(node, texture), texture });
  meshContentKey.set(mesh, rasterizationKey(node));
  meshWarpType.set(mesh, (node.warp?.type ?? 'none') as WarpType);
  return mesh;
}

function buildGeometry(node: TextNode, texture: Texture): MeshGeometry {
  const warp = node.warp;
  const type = (warp?.type ?? 'none') as WarpType;
  const grid = computeWarpGrid(type, warp?.intensity ?? 0, texture.width, texture.height);
  return new MeshGeometry({ positions: grid.positions, uvs: grid.uvs, indices: grid.indices });
}

function updateWarpedMesh(mesh: Mesh, node: TextNode): void {
  const key = rasterizationKey(node);
  const type = (node.warp?.type ?? 'none') as WarpType;

  if (meshContentKey.get(mesh) !== key) {
    // Text/font/fill/stroke changed — the rasterized texture itself is
    // stale, re-rasterize and rebuild the mesh geometry against the new
    // texture's (possibly different) size.
    const oldTexture = mesh.texture;
    const flat = buildFlatVisual(node);
    const renderer = getRenderer();
    const texture = renderer ? renderer.generateTexture(flat) : oldTexture;
    flat.destroy();
    mesh.texture = texture;
    mesh.geometry = buildGeometry(node, texture);
    oldTexture.destroy(true);
    meshContentKey.set(mesh, key);
    meshWarpType.set(mesh, type);
    return;
  }

  if (meshWarpType.get(mesh) !== type) {
    // Warp type changed — different row count means a different vertex/uv/
    // index layout (see ROWS in warpGeometry.ts), so the whole MeshGeometry
    // needs rebuilding, not just its positions buffer.
    mesh.geometry = buildGeometry(node, mesh.texture);
    meshWarpType.set(mesh, type);
    return;
  }

  // Only intensity changed within the same warp type (e.g. a slider drag) —
  // same vertex layout, texture is still valid, just recompute the vertex
  // grid in place. Cheap: no re-rasterization, no new MeshGeometry, meets
  // the DoD's <16ms/frame requirement.
  const grid = computeWarpGrid(type, node.warp?.intensity ?? 0, mesh.texture.width, mesh.texture.height);
  mesh.geometry.positions = grid.positions;
}

export const textRenderer = {
  // Plain text (the common case, no warp) stays a bare Text/Container —
  // no behavior/perf change from Phase 1/2/3-Pass-A. Only warped text pays
  // for the rasterize-to-texture-and-mesh approach.
  create(node: TextNode): Text | Container | Mesh {
    if (wantsMesh(node)) {
      const mesh = buildWarpedMesh(node);
      applyTransform(mesh, node);
      return mesh;
    }
    const visual = buildFlatVisual(node);
    applyTransform(visual, node);
    return visual;
  },
  update(obj: Text | Container | Mesh, node: TextNode): void {
    if (obj instanceof Mesh) {
      updateWarpedMesh(obj, node);
    } else if (obj instanceof Text) {
      obj.text = node.text;
      Object.assign(obj.style, fillStyle(node));
    } else {
      updateLayeredText(obj, node);
    }
    applyTransform(obj, node);
  },
};
