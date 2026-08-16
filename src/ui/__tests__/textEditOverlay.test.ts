import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import { textEditPatch } from '../TextEditOverlay';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
});

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 10, height: 10 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'a',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

describe('textEditPatch', () => {
  it('doi text va do lai size', () => {
    const patch = textEditPatch(node, 'abc', poppins);
    expect(patch.text).toBe('abc');
    expect(patch.size!.width).toBeGreaterThan(0);
    expect(patch.size!.height).toBeGreaterThan(0);
  });

  it('text dai hon thi size rong hon', () => {
    const short = textEditPatch(node, 'a', poppins).size!.width;
    const long = textEditPatch(node, 'aaaa', poppins).size!.width;
    expect(long).toBeGreaterThan(short);
  });

  it('khong co font thi chi doi text, giu nguyen size', () => {
    expect(textEditPatch(node, 'abc', null)).toEqual({ text: 'abc' });
  });
});
