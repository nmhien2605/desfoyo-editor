import { Text, type TextStyleFontWeight } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { fillToColor } from '../fillToColor';

function toFontWeight(weight: number): TextStyleFontWeight {
  const clamped = Math.min(900, Math.max(100, Math.round(weight / 100) * 100));
  return String(clamped) as TextStyleFontWeight;
}

function buildStyle(node: TextNode) {
  return {
    fontFamily: node.font.family,
    fontSize: node.font.size,
    fontWeight: toFontWeight(node.font.weight),
    fontStyle: node.font.style,
    align: node.align,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    fill: fillToColor(node.fill),
  };
}

export const textRenderer = {
  create(node: TextNode): Text {
    const obj = new Text({ text: node.text, style: buildStyle(node) });
    this.update(obj, node);
    return obj;
  },
  update(obj: Text, node: TextNode): void {
    obj.text = node.text;
    Object.assign(obj.style, buildStyle(node));
    applyTransform(obj, node);
  },
};
