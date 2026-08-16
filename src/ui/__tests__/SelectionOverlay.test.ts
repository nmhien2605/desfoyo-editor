import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { selectionBox, updateCropHandle } from '../SelectionOverlay';
import { loadFont, registerFont } from '../../text/fontService';
import type { TextNode } from '../../schema';

const FULL = { x: 0, y: 0, width: 1, height: 1 };

function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../../text/fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

const textNode: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

beforeAll(async () => {
  registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
  await loadFont('Poppins');
});

describe('selectionBox', () => {
  it('falls back to node.size for empty text (bounds would collapse to 0x0)', () => {
    const box = selectionBox({ ...textNode, text: '' });
    expect(box).toEqual({ x: 0, y: 0, width: 300, height: 120 });
  });

  it('falls back to node.size for whitespace-only text', () => {
    const box = selectionBox({ ...textNode, text: '   ' });
    expect(box).toEqual({ x: 0, y: 0, width: 300, height: 120 });
  });

  it('uses the warped bbox for non-empty text', () => {
    const box = selectionBox(textNode);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

describe('updateCropHandle', () => {
  it('se handle grows width/height from a drag toward bottom-right', () => {
    const next = updateCropHandle(FULL, 'se', { x: -0.2, y: -0.3 });
    expect(next).toEqual({ x: 0, y: 0, width: 0.8, height: 0.7 });
  });

  it('nw handle moves x/y and shrinks width/height', () => {
    const next = updateCropHandle(FULL, 'nw', { x: 0.2, y: 0.1 });
    expect(next).toEqual({ x: 0.2, y: 0.1, width: 0.8, height: 0.9 });
  });

  it('clamps x/y within 0..1', () => {
    const next = updateCropHandle(FULL, 'nw', { x: -0.5, y: -0.5 });
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });

  it('clamps width/height so the crop rect never exceeds the image bounds', () => {
    const next = updateCropHandle({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, 'se', {
      x: 1,
      y: 1,
    });
    expect(next.width).toBeLessThanOrEqual(0.5);
    expect(next.height).toBeLessThanOrEqual(0.5);
  });
});
