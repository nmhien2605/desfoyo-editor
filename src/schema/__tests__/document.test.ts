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

  it('accepts a group node nested inside a page (Phase 2)', () => {
    const doc = validDocument();
    doc.pages[0].children[0] = {
      id: 'node_2',
      type: 'group',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 100 },
      opacity: 1,
      visible: true,
      locked: false,
      children: [
        {
          id: 'node_3',
          type: 'shape',
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          size: { width: 50, height: 50 },
          opacity: 1,
          visible: true,
          locked: false,
          shape: 'rect',
          fill: { type: 'solid', color: '#00ff00' },
        },
      ],
    } as unknown as ReturnType<typeof validDocument>['pages'][0]['children'][0];

    expect(() => DocumentSchema.parse(doc)).not.toThrow();
  });

  it('accepts a font asset alongside an image asset (Phase 3)', () => {
    const doc = validDocument();
    doc.assets = {
      img_1: { type: 'image', dataUri: 'data:image/png;base64,AAAA' },
      font_1: { type: 'font', family: 'Custom Sans', dataUri: 'data:font/woff2;base64,AAAA' },
    } as unknown as ReturnType<typeof validDocument>['assets'];
    doc.fonts = ['Custom Sans'] as (typeof doc)['fonts'];

    expect(() => DocumentSchema.parse(doc)).not.toThrow();
  });

  it('accepts a multi-layer stroke on a text node (Phase 3)', () => {
    const doc = validDocument();
    doc.pages[0].children[0] = {
      id: 'node_text',
      type: 'text',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 40 },
      opacity: 1,
      visible: true,
      locked: false,
      text: 'Hello',
      font: { family: 'Inter', weight: 700, style: 'normal', size: 24 },
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      fill: { type: 'solid', color: '#111111' },
      stroke: {
        fill: { type: 'solid', color: '#000000' },
        width: 2,
        align: 'center',
        layers: [{ width: 6, fill: { type: 'solid', color: '#ffffff' }, offset: [2, 2] }],
      },
    } as unknown as ReturnType<typeof validDocument>['pages'][0]['children'][0];

    expect(() => DocumentSchema.parse(doc)).not.toThrow();
  });

  it('NodeSchema accepts svg nodes (Phase 4 Pass E)', () => {
    const svgNode = {
      id: 'node_3',
      type: 'svg',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 100 },
      opacity: 1,
      visible: true,
      locked: false,
      assetId: 'asset_1',
      overrides: { 'path-1': { type: 'solid', color: '#ff0000' } },
    };

    expect(() => NodeSchema.parse(svgNode)).not.toThrow();
  });
});
