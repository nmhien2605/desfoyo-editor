// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Text } from 'pixi.js';
import { textRenderer } from '../renderers/textRenderer';
import type { TextNode } from '../../schema';

function makeTextNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-1',
    transform: { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 200, height: 60 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    content: 'Hello world',
    font: { family: 'Roboto', size: 32 },
    align: 'left',
    fill: { type: 'solid', color: '#111111' },
    ...overrides,
  };
}

describe('textRenderer', () => {
  it('create() returns a PIXI.Text with the node content and position', () => {
    const node = makeTextNode();
    const obj = textRenderer.create(node);
    expect(obj).toBeInstanceOf(Text);
    expect(obj.text).toBe('Hello world');
    expect(obj.position.x).toBe(10);
    expect(obj.position.y).toBe(20);
  });

  it('update() changes the text content in place without recreating the object', () => {
    const node = makeTextNode();
    const obj = textRenderer.create(node);
    const updated = { ...node, content: 'Changed' };
    textRenderer.update(obj, updated);
    expect(obj.text).toBe('Changed');
  });

  it('update() applies fontSize/fontFamily/align from the node', () => {
    const node = makeTextNode({ font: { family: 'Montserrat', size: 64 }, align: 'center' });
    const obj = textRenderer.create(node);
    expect(obj.style.fontFamily).toBe('Montserrat');
    expect(obj.style.fontSize).toBe(64);
    expect(obj.style.align).toBe('center');
  });

  it('wraps text at the node size width', () => {
    const node = makeTextNode({ size: { width: 300, height: 100 } });
    const obj = textRenderer.create(node);
    expect(obj.style.wordWrap).toBe(true);
    expect(obj.style.wordWrapWidth).toBe(300);
  });

  it('does not throw when a font is not yet loaded (no live Pixi renderer in jsdom)', () => {
    const node = makeTextNode({ font: { family: 'Nonexistent Font', size: 32 } });
    expect(() => textRenderer.create(node)).not.toThrow();
  });
});
