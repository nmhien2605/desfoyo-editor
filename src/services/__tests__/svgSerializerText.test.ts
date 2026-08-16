import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadFont, registerFont, resetFontsForTest } from '../../text/fontService';
import { serializeNode } from '../svgSerializer';
import type { Document, TextNode } from '../../schema';

const doc: Document = {
  version: 1,
  id: 'doc-1',
  meta: { title: 'test', createdAt: 0, updatedAt: 0 },
  pages: [],
  assets: {},
};

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#ff0000' },
};

beforeAll(async () => {
  resetFontsForTest();
  const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  registerFont(
    'Poppins',
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
  );
  await loadFont('Poppins');
});

describe('serializeNode cho text', () => {
  it('xuat ra <path> vector chu khong phai <image>', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('<path');
    expect(svg).not.toContain('<image');
  });

  it('mang mau fill va fill-rule evenodd cho lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill-rule="evenodd"');
  });

  it('chu "o" xuat ra 2 subpath: outer + lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg.match(/M /g)?.length).toBe(2);
  });

  it('warp lam doi path data', () => {
    const plain = serializeNode(node, doc, []);
    const waved = serializeNode({ ...node, warp: { type: 'wave', intensity: 0.8 } }, doc, []);
    expect(waved).not.toBe(plain);
    expect(waved).toContain('<path');
  });

  it('font chua nap thi bo qua node, khong throw', () => {
    const svg = serializeNode({ ...node, font: { ...node.font, family: 'KhongCo' } }, doc, []);
    expect(svg).toBe('');
  });

  it('node an thi khong xuat gi', () => {
    expect(serializeNode({ ...node, visible: false }, doc, [])).toBe('');
  });
});
