import { describe, expect, it } from 'vitest';
import { DocumentSchema } from '../document';
import { NodeSchema } from '../node';
import { EffectSchema } from '../effect';

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

  it('accepts a multi-layer stroke on a shape node', () => {
    const doc = validDocument();
    doc.pages[0].children[0] = {
      id: 'node_shape',
      type: 'shape',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 100, height: 100 },
      opacity: 1,
      visible: true,
      locked: false,
      shape: 'rect',
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

  it('NodeSchema accepts text nodes (TextNode foundation slice)', () => {
    const textNode = {
      id: 'node_4',
      type: 'text',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      content: 'Hello',
      font: { family: 'Roboto', size: 48 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };

    expect(() => NodeSchema.parse(textNode)).not.toThrow();
  });

  it('NodeSchema rejects a text node missing required font.size', () => {
    const textNode = {
      id: 'node_5',
      type: 'text',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      content: 'Hello',
      font: { family: 'Roboto' },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };

    expect(() => NodeSchema.parse(textNode)).toThrow();
  });

  it('EffectSchema accepts the 3 new shadow-family effects (slice 2)', () => {
    const effects = [
      { type: 'block-shadow', color: '#000000', offset: [4, 4], alpha: 0.8 },
      { type: 'line-shadow', color: '#000000', offset: [6, 6], thickness: 1, alpha: 0.9 },
      { type: '3d-shadow', color: '#000000', angle: Math.PI / 4, depth: 10, alpha: 1 },
    ];
    for (const effect of effects) {
      expect(() => EffectSchema.parse(effect)).not.toThrow();
    }
  });

  it('EffectSchema rejects a block-shadow missing required alpha', () => {
    const effect = { type: 'block-shadow', color: '#000000', offset: [4, 4] };
    expect(() => EffectSchema.parse(effect)).toThrow();
  });
});
