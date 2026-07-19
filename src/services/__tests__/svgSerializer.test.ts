import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import * as opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { serializeNode, type VectorTextMap } from '../svgSerializer';
import { layoutText } from '../../text/glyphOutline';
import type { Document, GroupNode, ImageNode, Node, ShapeNode, TextNode } from '../../schema';

// Same OFL Roboto-Black.ttf fixture as text/__tests__/glyphOutline.test.ts —
// a real opentype.Font is needed to produce real opentype.Path glyphs (with
// a working toPathData()), which a hand-built literal TextLayout couldn't.
const here = dirname(fileURLToPath(import.meta.url));
const fontBuffer = readFileSync(join(here, '../../text/__tests__/fixtures/Roboto-Black.ttf'));
const font = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));

const doc: Document = {
  version: 1,
  id: 'doc_1',
  meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
  pages: [],
  assets: { 'asset-1': { type: 'image', dataUri: 'data:image/png;base64,AAAA' } },
  fonts: [],
  paths: {},
};

const baseTransform = { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 };
const baseFields = { opacity: 1, visible: true, locked: false };

function rectNode(overrides: Partial<ShapeNode> = {}): ShapeNode {
  return {
    id: 'shape-1',
    type: 'shape',
    transform: { ...baseTransform },
    size: { width: 100, height: 50 },
    ...baseFields,
    shape: 'rect',
    fill: { type: 'solid', color: '#ff0000' },
    ...overrides,
  };
}

describe('serializeNode', () => {
  it('returns an empty string for an invisible node', () => {
    expect(serializeNode(rectNode({ visible: false }), doc, [])).toBe('');
  });

  it('serializes a rect shape with solid fill', () => {
    const out = serializeNode(rectNode(), doc, []);
    expect(out).toContain('<rect width="100" height="50"');
    expect(out).toContain('fill="#ff0000"');
    expect(out).toContain('translate(10 20)');
  });

  it('serializes a rounded rect via rx', () => {
    const out = serializeNode(rectNode({ cornerRadius: 8 }), doc, []);
    expect(out).toContain('rx="8"');
  });

  it('serializes an ellipse centered in its bounds', () => {
    const node = rectNode({ shape: 'ellipse' });
    const out = serializeNode(node, doc, []);
    expect(out).toContain('<ellipse cx="50" cy="25" rx="50" ry="25"');
  });

  it('serializes a linear-gradient fill via a <defs> entry', () => {
    const defs: string[] = [];
    const node = rectNode({ fill: { type: 'linear-gradient', angle: 0, stops: [{ offset: 0, color: '#000' }, { offset: 1, color: '#fff' }] } });
    const out = serializeNode(node, doc, defs);
    expect(defs).toHaveLength(1);
    expect(defs[0]).toContain('<linearGradient');
    expect(out).toMatch(/fill="url\(#grad-\d+\)"/);
  });

  it('serializes an image node referencing its resolved asset data URI', () => {
    const node: ImageNode = {
      id: 'img-1',
      type: 'image',
      transform: { ...baseTransform },
      size: { width: 40, height: 40 },
      ...baseFields,
      assetId: 'asset-1',
    };
    const out = serializeNode(node, doc, []);
    expect(out).toContain('href="data:image/png;base64,AAAA"');
  });

  it('rasterizes a text node via the provided map, and omits it when missing', () => {
    const node: TextNode = {
      id: 'text-1',
      type: 'text',
      transform: { ...baseTransform },
      size: { width: 200, height: 40 },
      ...baseFields,
      text: 'Hello',
      font: { family: 'Inter', weight: 400, style: 'normal', size: 24 },
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      fill: { type: 'solid', color: '#000000' },
    };
    expect(serializeNode(node, doc, [])).toBe('');
    const out = serializeNode(node, doc, [], { 'text-1': 'data:image/png;base64,BBBB' });
    expect(out).toContain('href="data:image/png;base64,BBBB"');
  });

  it('serializes a vectorized text node as <path>, not <image>, when present in the vector map', () => {
    const node: TextNode = {
      id: 'text-2',
      type: 'text',
      transform: { ...baseTransform },
      size: { width: 200, height: 40 },
      ...baseFields,
      text: 'Hi',
      font: { family: 'Roboto', weight: 900, style: 'normal', size: 24 },
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      fill: { type: 'solid', color: '#000000' },
    };
    const layout = layoutText(node, font);
    expect(layout).toBeDefined();
    const vectorText: VectorTextMap = { 'text-2': layout! };

    const out = serializeNode(node, doc, [], undefined, vectorText);
    expect(out).toContain('<path');
    expect(out).not.toContain('<image');
    expect(out).toContain('fill="#000000"');
  });

  it('falls back to raster for a text node absent from the vector map, even when one is provided', () => {
    const node: TextNode = {
      id: 'text-3',
      type: 'text',
      transform: { ...baseTransform },
      size: { width: 200, height: 40 },
      ...baseFields,
      text: 'Hello',
      font: { family: 'Inter', weight: 400, style: 'normal', size: 24 },
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      fill: { type: 'solid', color: '#000000' },
    };
    const out = serializeNode(node, doc, [], { 'text-3': 'data:image/png;base64,CCCC' }, {});
    expect(out).toContain('href="data:image/png;base64,CCCC"');
    expect(out).not.toContain('<path');
  });

  it('emits one <path> per stroke layer plus the fill path, stroke layers first', () => {
    const node: TextNode = {
      id: 'text-4',
      type: 'text',
      transform: { ...baseTransform },
      size: { width: 200, height: 40 },
      ...baseFields,
      text: 'Hi',
      font: { family: 'Roboto', weight: 900, style: 'normal', size: 24 },
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      fill: { type: 'solid', color: '#000000' },
      stroke: {
        fill: { type: 'solid', color: '#ff0000' },
        width: 2,
        align: 'outside',
        layers: [
          { width: 4, fill: { type: 'solid', color: '#ff0000' }, offset: [1, 1] },
          { width: 2, fill: { type: 'solid', color: '#00ff00' } },
        ],
      },
    };
    const layout = layoutText(node, font);
    expect(layout).toBeDefined();

    const out = serializeNode(node, doc, [], undefined, { 'text-4': layout! });
    const pathCount = (out.match(/<path/g) ?? []).length;
    expect(pathCount).toBe(3); // 2 stroke layers + 1 fill path
    expect(out).toContain('translate(1 1)');
    expect(out.indexOf('stroke="#ff0000"')).toBeLessThan(out.indexOf('fill="#000000"'));
  });

  it('wraps group children recursively, applying its own transform to the <g>', () => {
    const group: GroupNode = {
      id: 'group-1',
      type: 'group',
      transform: { ...baseTransform },
      size: { width: 100, height: 50 },
      ...baseFields,
      children: [rectNode({ id: 'shape-2' }) as Node],
    };
    const out = serializeNode(group, doc, []);
    expect(out.startsWith('<g')).toBe(true);
    expect(out).toContain('<rect');
  });
});
