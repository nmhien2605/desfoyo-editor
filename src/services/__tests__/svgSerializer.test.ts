import { describe, expect, it } from 'vitest';
import { serializeNode } from '../svgSerializer';
import type { Document, GroupNode, ImageNode, Node, ShapeNode } from '../../schema';

const doc: Document = {
  version: 1,
  id: 'doc_1',
  meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
  pages: [],
  assets: { 'asset-1': { type: 'image', dataUri: 'data:image/png;base64,AAAA' } },
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
