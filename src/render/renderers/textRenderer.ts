import { Color, Container, Mesh, MeshGeometry, Text, type TextStyleFontWeight, type Texture } from 'pixi.js';
import type { Document, Effect, TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill, strokeColorFields } from '../fillToColor';
import { getRenderer } from '../rendererContext';
import { computeWarpGrid, type PathData, type WarpType } from '../../text/warpGeometry';
import { extrudeLayerOffset, extrudeLayerShade, extrudeSteps } from '../../text/extrudeLayers';

const MESH_WARP_TYPES: WarpType[] = ['arc', 'wave', 'bulge', 'flag', 'perspective', 'path'];

function resolvePath(node: TextNode, doc: Document): PathData | undefined {
  const pathId = node.warp?.pathId;
  return pathId ? doc.paths[pathId] : undefined;
}

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

// Exported so imageRenderer.ts can build a plain mask Text from a
// text-type mask ref (Phase 4 Pass B) without duplicating style mapping.
export function fillStyle(node: TextNode) {
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
  containerKind.set(container, 'stroke');
  return container;
}

// Exported so SceneReconciler.ts's needsRecreate() can detect the
// Text|Container ↔ Mesh identity swap the same way it already detects the
// Text ↔ Container (stroke) swap from Pass A.
export function wantsMesh(node: TextNode): boolean {
  return !!node.warp && (MESH_WARP_TYPES as string[]).includes(node.warp.type) && !!getRenderer();
}

type Extrude3dEffect = Extract<Effect, { type: 'extrude3d' }>;

function extrudeEffect(node: TextNode): Extrude3dEffect | undefined {
  return node.effects?.find((e): e is Extrude3dEffect => e.type === 'extrude3d');
}

// Mutually exclusive with mesh warp in the properties panel UI (see
// PropertiesPanel.tsx), so no combined mesh+extrude renderer path exists —
// if both were somehow set, wantsMesh wins (checked first everywhere below).
export function wantsExtrude(node: TextNode): boolean {
  return !wantsMesh(node) && !!extrudeEffect(node);
}

// Container↔Container (stroke vs extrude) can't be told apart by
// `instanceof` alone — this tags which shape a Container currently holds,
// mirroring meshWarpType's role for Mesh below.
const containerKind = new WeakMap<Container, 'stroke' | 'extrude'>();

// N flat Text clones stacked along (cos(angle), sin(angle)), darkening with
// depth to fake a lit extrusion side — the same "stack flat clones" trick
// updateLayeredText already uses for multi-layer stroke, just parameterized
// by depth/angle/color instead of Stroke.layers (offset/shade math lives in
// text/extrudeLayers.ts so it's testable without a Pixi renderer).
// ponytail: this is flat-clone shading, not a real mesh/normal-mapped 3D
// extrude — upgrade path (true perspective + lighting) belongs to Pass D's
// custom-GLSL work if ever needed.
function updateExtrudedText(container: Container, node: TextNode, effect: Extrude3dEffect): void {
  const steps = extrudeSteps(effect.depth);

  if (container.children.length !== steps + 1) {
    container.removeChildren().forEach((c) => c.destroy());
    for (let i = 0; i < steps + 1; i++) container.addChild(new Text({ text: node.text, style: fillStyle(node) }));
  }

  for (let j = 0; j < steps; j++) {
    // Furthest layer first (drawn first = behind), shallowest layer last
    // before the true fill — so depth reads as receding away from the front face.
    const layerDepth = steps - j;
    const child = container.children[j] as Text;
    child.text = node.text;
    const shade = extrudeLayerShade(layerDepth, steps);
    Object.assign(child.style, { ...fillStyle(node), fill: new Color(effect.color).multiply([shade, shade, shade, 1]).toHex() });
    const { x, y } = extrudeLayerOffset(layerDepth, steps, effect.depth, effect.angle);
    child.position.set(x, y);
  }

  const fillChild = container.children[steps] as Text;
  fillChild.text = node.text;
  Object.assign(fillChild.style, fillStyle(node));
  fillChild.position.set(0, 0);
}

function buildExtrudedVisual(node: TextNode, effect: Extrude3dEffect): Container {
  const container = new Container();
  updateExtrudedText(container, node, effect);
  containerKind.set(container, 'extrude');
  return container;
}

// Single source of truth for "which of the 4 mutually-exclusive Pixi object
// shapes a text node's current props want" — SceneReconciler.ts's
// needsRecreate() uses this to detect every identity-swap boundary in one
// place instead of re-deriving it.
export function needsTextRecreate(obj: Container, node: TextNode): boolean {
  if (wantsMesh(node)) return !(obj instanceof Mesh);
  if (obj instanceof Mesh) return true;
  const extrude = extrudeEffect(node);
  if (extrude) return obj instanceof Text || containerKind.get(obj) !== 'extrude';
  if (node.stroke) return obj instanceof Text || containerKind.get(obj) !== 'stroke';
  return !(obj instanceof Text);
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

function buildWarpedMesh(node: TextNode, doc: Document): Mesh {
  const renderer = getRenderer();
  if (!renderer) throw new Error('buildWarpedMesh called without an active renderer');

  const flat = buildFlatVisual(node);
  const texture = renderer.generateTexture(flat);
  flat.destroy();

  const mesh = new Mesh({ geometry: buildGeometry(node, texture, doc), texture });
  meshContentKey.set(mesh, rasterizationKey(node));
  meshWarpType.set(mesh, (node.warp?.type ?? 'none') as WarpType);
  return mesh;
}

function buildGeometry(node: TextNode, texture: Texture, doc: Document): MeshGeometry {
  const warp = node.warp;
  const type = (warp?.type ?? 'none') as WarpType;
  const grid = computeWarpGrid(type, warp?.intensity ?? 0, texture.width, texture.height, 32, resolvePath(node, doc));
  return new MeshGeometry({ positions: grid.positions, uvs: grid.uvs, indices: grid.indices });
}

function updateWarpedMesh(mesh: Mesh, node: TextNode, doc: Document): void {
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
    mesh.geometry = buildGeometry(node, texture, doc);
    oldTexture.destroy(true);
    meshContentKey.set(mesh, key);
    meshWarpType.set(mesh, type);
    return;
  }

  if (meshWarpType.get(mesh) !== type) {
    // Warp type changed — different row count means a different vertex/uv/
    // index layout (see ROWS in warpGeometry.ts), so the whole MeshGeometry
    // needs rebuilding, not just its positions buffer.
    mesh.geometry = buildGeometry(node, mesh.texture, doc);
    meshWarpType.set(mesh, type);
    return;
  }

  // Only intensity/path changed within the same warp type (e.g. a slider or
  // path-handle drag) — same vertex layout, texture is still valid, just
  // recompute the vertex grid in place. Cheap: no re-rasterization, no new
  // MeshGeometry, meets the DoD's <16ms/frame requirement.
  const grid = computeWarpGrid(type, node.warp?.intensity ?? 0, mesh.texture.width, mesh.texture.height, 32, resolvePath(node, doc));
  mesh.geometry.positions = grid.positions;
}

export const textRenderer = {
  // Plain text (the common case, no warp/extrude) stays a bare Text/Container
  // — no behavior/perf change from Phase 1/2/3-Pass-A. Only warped or
  // extruded text pays for the rasterize-to-texture-and-mesh (or
  // clone-stack) approach.
  create(node: TextNode, doc: Document): Text | Container | Mesh {
    if (wantsMesh(node)) {
      const mesh = buildWarpedMesh(node, doc);
      applyTransform(mesh, node);
      return mesh;
    }
    const extrude = extrudeEffect(node);
    const visual = extrude ? buildExtrudedVisual(node, extrude) : buildFlatVisual(node);
    applyTransform(visual, node);
    return visual;
  },
  update(obj: Text | Container | Mesh, node: TextNode, doc: Document): void {
    const extrude = extrudeEffect(node);
    if (obj instanceof Mesh) {
      updateWarpedMesh(obj, node, doc);
    } else if (extrude) {
      updateExtrudedText(obj as Container, node, extrude);
    } else if (obj instanceof Text) {
      obj.text = node.text;
      Object.assign(obj.style, fillStyle(node));
    } else {
      updateLayeredText(obj as Container, node);
    }
    applyTransform(obj, node);
  },
};
