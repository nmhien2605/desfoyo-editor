import { Container, Text, type TextStyleFontWeight } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill, strokeColorFields } from '../fillToColor';

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

export const textRenderer = {
  // Plain text (the common case, no stroke) stays a bare Text instance —
  // no behavior/perf change from Phase 1/2. Only text with a stroke pays
  // for the Container-of-Text-layers approach.
  create(node: TextNode): Text | Container {
    if (!node.stroke) {
      const obj = new Text({ text: node.text, style: fillStyle(node) });
      applyTransform(obj, node);
      return obj;
    }
    const container = new Container();
    updateLayeredText(container, node);
    applyTransform(container, node);
    return container;
  },
  update(obj: Text | Container, node: TextNode): void {
    if (obj instanceof Text) {
      obj.text = node.text;
      Object.assign(obj.style, fillStyle(node));
    } else {
      updateLayeredText(obj, node);
    }
    applyTransform(obj, node);
  },
};
