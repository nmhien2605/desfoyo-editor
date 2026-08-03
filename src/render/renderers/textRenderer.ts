import { Text, TextStyle } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { loadGoogleFont } from '../../fonts/googleFonts';

// TextNode.stroke is schema-only in this slice — rendering multi-layer
// text stroke is the decorations slice's job (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md).
const loadedFontKey = new WeakMap<Text, string>();

function fontKey(node: TextNode): string {
  return `${node.font.family}:${node.font.weight ?? 400}:${node.font.italic ? 'italic' : 'normal'}`;
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
  const key = fontKey(node);
  if (loadedFontKey.get(obj) === key) return;
  loadedFontKey.set(obj, key);
  loadGoogleFont(node.font.family, node.font.weight ?? 400)
    .then(() => {
      if (!obj.destroyed) obj.style = buildStyle(node);
    })
    .catch(() => {
      // A font that fails to load shouldn't crash the editor — text stays
      // on the fallback font, same "never throw" convention
      // imageRenderer.ts's loadTexture uses for a broken image asset.
    });
}

export const textRenderer = {
  create(node: TextNode): Text {
    const obj = new Text({ text: node.content, style: buildStyle(node) });
    this.update(obj, node);
    return obj;
  },
  update(obj: Text, node: TextNode): void {
    obj.text = node.content;
    obj.style = buildStyle(node);
    loadFontIfNeeded(obj, node);
    applyTransform(obj, node);
  },
};
