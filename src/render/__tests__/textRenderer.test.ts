import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getLoadedFont, loadFont, registerFont } from '../../text/fontService';
import { drawTextShapes, type TextDrawTarget } from '../renderers/textRenderer';
import { textGeometry } from '../../text/textGeometry';
import type { TextNode } from '../../schema';

function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../../text/fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function fakeTarget() {
  const calls: string[] = [];
  const target: TextDrawTarget = {
    poly() {
      calls.push('poly');
      return target;
    },
    fill() {
      calls.push('fill');
      return target;
    },
    cut() {
      calls.push('cut');
      return target;
    },
  };
  return { target, calls };
}

const node: TextNode = {
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

describe('drawTextShapes', () => {
  it('chu "o": fill outer roi cut lo, dung thu tu', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry(node, font).shapes, node.fill);
    // poly(outer) -> fill -> poly(hole) -> cut
    expect(calls).toEqual(['poly', 'fill', 'poly', 'cut']);
  });

  it('chu khong lo chi fill, khong cut', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: 'l' }, font).shapes, node.fill);
    expect(calls).toEqual(['poly', 'fill']);
  });

  it('text rong khong ve gi', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: '' }, font).shapes, node.fill);
    expect(calls).toEqual([]);
  });
});
