import { describe, expect, it } from 'vitest';
import { DocumentSchema } from '../document';
import { NodeSchema } from '../node';

function validDocument() {
  return {
    version: 1,
    id: 'doc_1',
    meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
    pages: [
      {
        id: 'page_1',
        name: 'Page 1',
        size: { width: 1080, height: 1080 },
        background: { type: 'color', value: '#ffffff' },
        children: [
          {
            id: 'node_1',
            type: 'shape',
            transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
            size: { width: 100, height: 100 },
            opacity: 1,
            visible: true,
            locked: false,
            shape: 'rect',
            fill: { type: 'solid', color: '#ff0000' },
          },
        ],
      },
    ],
    assets: {},
    fonts: [],
  };
}

describe('DocumentSchema', () => {
  it('parses a valid Phase 1 document', () => {
    expect(() => DocumentSchema.parse(validDocument())).not.toThrow();
  });

  it('rejects an out-of-phase node type (group)', () => {
    const doc = validDocument();
    doc.pages[0].children[0] = {
      id: 'node_2',
      type: 'group',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 100 },
      opacity: 1,
      visible: true,
      locked: false,
      children: [],
    } as unknown as ReturnType<typeof validDocument>['pages'][0]['children'][0];

    expect(() => DocumentSchema.parse(doc)).toThrow();
  });

  it('NodeSchema rejects svg nodes until Phase 4', () => {
    const svgNode = {
      id: 'node_3',
      type: 'svg',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 100 },
      opacity: 1,
      visible: true,
      locked: false,
      assetId: 'asset_1',
    };

    expect(() => NodeSchema.parse(svgNode)).toThrow();
  });
});
