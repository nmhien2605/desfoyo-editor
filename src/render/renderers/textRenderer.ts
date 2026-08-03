import { Text, TextStyle, Mesh, MeshGeometry, type Container, type Shader } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { loadGoogleFont } from '../../fonts/googleFonts';
import { getFontForWarp } from '../../fonts/googleFontFiles';
import { layoutGlyphs } from '../../text/layoutGlyphs';
import { buildWarpedGlyphGeometry } from '../../text/warpMesh';
import { buildGlyphFillShader, solidFillTintAlpha } from '../../text/shaders/glyphFill';

// TextNode.stroke is schema-only in this slice — rendering multi-layer
// text stroke is the decorations slice's job (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md).
const loadedFontKey = new WeakMap<Text, string>();
const latestNode = new WeakMap<Text, TextNode>();

function fontKey(node: TextNode): string {
  return `${node.font.family}:${node.font.weight ?? 400}:${node.font.italic ? 'italic' : 'normal'}`;
}

// Everything buildStyle actually reads — used to skip rebuilding (and thus
// re-rasterizing) the TextStyle on updates that only touch transform/opacity
// (dragging, resizing, an opacity slider), which fire continuously and
// don't change how the text should look.
function styleSignature(node: TextNode): string {
  return JSON.stringify([node.font, node.align, node.fill, node.size.width]);
}

// node.size is the text box's wrap width/height, not an auto-fit-to-content
// box — wordWrap always on, matching how a resizable text box behaves in
// Canva/Kittl-style editors. Height isn't clipped (Pixi doesn't do this for
// Text out of the box); overflow handling isn't in scope for this slice.
function buildStyle(node: TextNode): TextStyle {
  const options: ConstructorParameters<typeof TextStyle>[0] = {
    fontFamily: node.font.family,
    fontSize: node.font.size,
    fontStyle: node.font.italic ? 'italic' : 'normal',
    letterSpacing: node.font.letterSpacing ?? 0,
    align: node.align,
    fill: resolveFill(node.fill),
    wordWrap: true,
    wordWrapWidth: node.size.width,
  };
  if (node.font.weight !== undefined) options.fontWeight = String(node.font.weight) as TextStyle['fontWeight'];
  if (node.font.lineHeight !== undefined) options.lineHeight = node.font.lineHeight;
  return new TextStyle(options);
}

// Renders immediately with whatever font is synchronously available (the
// browser's fallback font if the Google Font hasn't loaded yet), then
// re-applies the style once loadGoogleFont resolves. No loading state, no
// blocking — same convention imageRenderer.ts's loadTexture uses for
// async asset loading.
function loadFontIfNeeded(obj: Text, node: TextNode): void {
  latestNode.set(obj, node);
  const key = fontKey(node);
  if (loadedFontKey.get(obj) === key) return;
  loadedFontKey.set(obj, key);
  loadGoogleFont(node.font.family, node.font.weight ?? 400)
    .then(() => {
      if (!obj.destroyed) obj.style = buildStyle(latestNode.get(obj) ?? node);
    })
    .catch(() => {
      // A font that fails to load shouldn't crash the editor — text stays
      // on the fallback font, same "never throw" convention
      // imageRenderer.ts's loadTexture uses for a broken image asset.
    });
}

// Mesh<MeshGeometry, Shader>, not bare Mesh — Mesh's SHADER generic defaults
// to TextureShader (see node_modules/pixi.js's Mesh.d.ts), but
// buildGlyphFillShader returns a plain Shader, not a TextureShader (no
// .texture). A bare `Mesh` annotation here would make every warped Text's
// object fail to type-check against what `new Mesh({ shader: ... })` above
// actually constructs.
type GlyphMesh = Mesh<MeshGeometry, Shader>;

// Mesh path: keyed the same way loadFontIfNeeded's flat-text path is, but
// tracks the FULL geometry-affecting signature (content/font/fill/warp/size),
// since fill and warp now bake directly into vertex data/shader uniforms
// instead of TextStyle.
const meshSignature = new WeakMap<GlyphMesh, string>();
function warpSignature(node: TextNode): string {
  return JSON.stringify([node.content, node.font, node.fill, node.warp, node.size.width, node.size.height]);
}

// The fill's own alpha (solidFillTintAlpha's `alpha`), separate from
// node.opacity. applyTransform unconditionally sets obj.alpha = node.opacity
// on every update() call, so the fill alpha can't be folded into obj.alpha
// directly (rebuildWarpMesh only re-runs when warpSignature changes, but
// applyTransform runs on every update — it would wipe out the fill's
// contribution on the next drag/resize/opacity-only update). Storing it here
// and re-multiplying it into obj.alpha after every applyTransform call (see
// update() below) keeps both contributions composed correctly regardless of
// which one changed.
const meshFillAlpha = new WeakMap<GlyphMesh, number>();

async function rebuildWarpMesh(obj: GlyphMesh, node: TextNode, sig: string): Promise<void> {
  if (!node.warp) return;
  const font = await getFontForWarp(node.font.family, node.font.weight ?? 400, node.content);
  if (!font || obj.destroyed) return; // never-throw degrade — see googleFontFiles.ts's own convention
  // Stale-write guard: if a later update (different warpSignature) started
  // and finished before this one, meshSignature.get(obj) will have moved on
  // — discard this now-stale result instead of overwriting the newer one.
  // Same pattern as loadFontIfNeeded's latestNode guard above.
  if (meshSignature.get(obj) !== sig) return;
  const placements = layoutGlyphs(font, node.content, node.font.size, node.size.width, {
    letterSpacing: node.font.letterSpacing,
    lineHeight: node.font.lineHeight,
    align: node.align,
  });
  const geom = buildWarpedGlyphGeometry(font, placements, node.font.size, node.warp, node.size.width, node.size.height);
  obj.geometry = new MeshGeometry({ positions: geom.positions, uvs: geom.gradientUvs, indices: geom.indices });
  obj.shader = buildGlyphFillShader(node.fill);
  const { tint, alpha } = solidFillTintAlpha(node.fill);
  obj.tint = tint;
  meshFillAlpha.set(obj, alpha);
  obj.alpha = node.opacity * alpha;
}

export const textRenderer = {
  create(node: TextNode): Text | GlyphMesh {
    if (node.warp) {
      const obj = new Mesh({ geometry: new MeshGeometry({ positions: new Float32Array(), uvs: new Float32Array(), indices: new Uint32Array() }), shader: buildGlyphFillShader(node.fill) });
      this.update(obj, node);
      return obj;
    }
    const obj = new Text({ text: node.content, style: buildStyle(node) });
    this.update(obj, node);
    return obj;
  },
  update(obj: Text | GlyphMesh, node: TextNode): void {
    if (obj instanceof Mesh) {
      const prevSig = meshSignature.get(obj);
      const sig = warpSignature(node);
      if (prevSig !== sig) {
        meshSignature.set(obj, sig);
        void rebuildWarpMesh(obj, node, sig);
      }
      applyTransform(obj, node);
      // applyTransform just set obj.alpha = node.opacity, unconditionally
      // overwriting whatever rebuildWarpMesh last set — re-fold in the
      // fill's own alpha (see meshFillAlpha comment above) on every update,
      // not just on rebuilds, so a drag/resize/opacity-only update can't
      // silently drop it.
      obj.alpha *= meshFillAlpha.get(obj) ?? 1;
      return;
    }
    obj.text = node.content;
    const prevNode = latestNode.get(obj);
    if (!prevNode || styleSignature(prevNode) !== styleSignature(node)) {
      obj.style = buildStyle(node);
    }
    loadFontIfNeeded(obj, node);
    applyTransform(obj, node);
  },
  // Consumed by SceneReconciler.apply() — see Global Constraints. A node
  // whose `warp` presence disagrees with its current display object's class
  // needs a full create+replace, not an in-place update, since PIXI.Text and
  // PIXI.Mesh are structurally different Pixi objects.
  needsRecreate(obj: Container, node: TextNode): boolean {
    const isMesh = obj instanceof Mesh;
    return isMesh !== !!node.warp;
  },
};
