import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Document, GroupNode, ShapeNode, TextNode } from '../../schema';
import { reconcileStaleSize, singleSelectedNode } from '../PropertiesPanel';

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
  text: 'abc',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

describe('reconcileStaleSize', () => {
  it('font chua nap thi tra null, khong doan mo', () => {
    expect(reconcileStaleSize(node, null)).toBeNull();
  });

  it('node.size sai lech (vi du: reselect sau khi font tai xong trong luc bi bo chon) thi tra patch dung', () => {
    // node.size = 10x10 co tinh, khong khop voi kich thuoc that cua "abc" o
    // Poppins 100px — mo phong dung tinh huong finding #6: font da nap xong
    // tu truoc (vi du trong luc node bi bo chon, listener onFontLoaded da
    // ban roi) nhung size chua duoc sua.
    const patch = reconcileStaleSize(node, poppins);
    expect(patch).not.toBeNull();
    expect(patch!.width).toBeGreaterThan(50);
    expect(patch!.height).toBeGreaterThan(50);
  });

  it('node.size da khop (trong pham vi epsilon) thi tra null, khong dispatch thua', () => {
    const measured = reconcileStaleSize(node, poppins)!;
    const synced: TextNode = { ...node, size: measured };
    expect(reconcileStaleSize(synced, poppins)).toBeNull();
  });

  it('sai lech nho hon epsilon (0.01) van tra null', () => {
    const measured = reconcileStaleSize(node, poppins)!;
    const almostSynced: TextNode = {
      ...node,
      size: { width: measured.width + 0.005, height: measured.height - 0.005 },
    };
    expect(reconcileStaleSize(almostSynced, poppins)).toBeNull();
  });
});

function shapeNode(id: string): ShapeNode {
  return {
    id,
    type: 'shape',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 20, height: 20 },
    opacity: 1,
    visible: true,
    locked: false,
    shape: 'rect',
    fill: { type: 'solid', color: '#000000' },
  };
}

function groupNode(id: string, children: ShapeNode[]): GroupNode {
  return {
    id,
    type: 'group',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 20, height: 20 },
    opacity: 1,
    visible: true,
    locked: false,
    children,
  };
}

function makeDocument(topLevelChildren: (ShapeNode | GroupNode)[]): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Test', createdAt: 0, updatedAt: 0 },
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        size: { width: 800, height: 600 },
        background: { type: 'color', value: '#ffffff' },
        children: topLevelChildren,
      },
    ],
    assets: {},
  };
}

describe('singleSelectedNode', () => {
  it('node nam trong group van hien duoc panel (khong con "No selection")', () => {
    const child = shapeNode('child-1');
    const document = makeDocument([groupNode('group-1', [child])]);
    const state = { document, activePageId: 'page-1', selectedNodeIds: new Set(['child-1']) };
    expect(singleSelectedNode(state)).toEqual(child);
  });

  it('chon nhieu hon 1 node thi tra null', () => {
    const document = makeDocument([shapeNode('a'), shapeNode('b')]);
    const state = { document, activePageId: 'page-1', selectedNodeIds: new Set(['a', 'b']) };
    expect(singleSelectedNode(state)).toBeNull();
  });

  it('khong chon gi thi tra null', () => {
    const document = makeDocument([shapeNode('a')]);
    const state = { document, activePageId: 'page-1', selectedNodeIds: new Set<string>() };
    expect(singleSelectedNode(state)).toBeNull();
  });
});
