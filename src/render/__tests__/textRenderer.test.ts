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
    moveTo() {
      calls.push('moveTo');
      return target;
    },
    bezierCurveTo() {
      calls.push('bezierCurveTo');
      return target;
    },
    closePath() {
      calls.push('closePath');
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
  it('chu "o": fill outer roi cut lo, dung thu tu (khong hardcode so cung)', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry(node, font).shapes, node.fill);
    // moveTo, [bezierCurveTo]+, closePath, fill  ->  moveTo, [bezierCurveTo]+, closePath, cut
    expect(calls.join(',')).toMatch(
      /^moveTo(,bezierCurveTo)+,closePath,fill,moveTo(,bezierCurveTo)+,closePath,cut$/,
    );
    expect(calls.filter((c) => c === 'fill')).toHaveLength(1);
    expect(calls.filter((c) => c === 'cut')).toHaveLength(1);
  });

  it('chu khong lo chi fill, khong cut', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: 'l' }, font).shapes, node.fill);
    expect(calls[0]).toBe('moveTo');
    expect(calls[calls.length - 1]).toBe('fill');
    expect(calls.filter((c) => c === 'cut')).toHaveLength(0);
    expect(calls.filter((c) => c === 'fill')).toHaveLength(1);
  });

  it('text rong khong ve gi', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: '' }, font).shapes, node.fill);
    expect(calls).toEqual([]);
  });

  it('ve outer bang moveTo + bezierCurveTo + closePath roi fill, hole thi cut', () => {
    const calls: string[] = [];
    const target = {
      moveTo: () => (calls.push('moveTo'), target),
      bezierCurveTo: () => (calls.push('bezierCurveTo'), target),
      closePath: () => (calls.push('closePath'), target),
      fill: () => (calls.push('fill'), target),
      cut: () => (calls.push('cut'), target),
    };
    drawTextShapes(
      target,
      [
        {
          outer: [0, 0, 1, 0, 2, 0, 3, 0],
          holes: [[0, 0, 1, 0, 2, 0, 3, 0]],
        },
      ],
      { type: 'solid', color: '#000000' },
    );
    expect(calls).toEqual([
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'fill',
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'cut',
    ]);
  });
});
