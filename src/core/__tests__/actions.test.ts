import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../store';
import { alignSelection, distributeSelection } from '../actions';
import type { Document, Node, ShapeNode } from '../../schema';

function shapeNode(id: string, x: number, y: number, width = 20, height = 20): ShapeNode {
  return {
    id,
    type: 'shape',
    transform: { x, y, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width, height },
    opacity: 1,
    visible: true,
    locked: false,
    shape: 'rect',
    fill: { type: 'solid', color: '#000000' },
  };
}

function makeDocument(nodes: Node[]): Document {
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
        children: nodes,
      },
    ],
    assets: {},
  };
}

function xOf(store: ReturnType<typeof createEditorStore>, id: string): number {
  const node = store.getState().document.pages[0].children.find((n) => n.id === id)!;
  return node.transform.x;
}
describe('alignSelection', () => {
  it('aligns left edges to the leftmost bbox edge', () => {
    // centered pivots with 20x20 size -> bbox min = x - 10
    const store = createEditorStore(makeDocument([shapeNode('a', 10, 0), shapeNode('b', 50, 0)]));
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    alignSelection(store, 'left');
    // group bbox min.x = min(10-10, 50-10) = 0; each node's own bbox min should now be 0 -> x = 10
    expect(xOf(store, 'a')).toBeCloseTo(10);
    expect(xOf(store, 'b')).toBeCloseTo(10);
  });

  it('aligns centers to the shared pivot', () => {
    const store = createEditorStore(makeDocument([shapeNode('a', 0, 0), shapeNode('b', 100, 0)]));
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    alignSelection(store, 'center');
    expect(xOf(store, 'a')).toBeCloseTo(50);
    expect(xOf(store, 'b')).toBeCloseTo(50);
  });

  it('is a no-op below 2 selected nodes', () => {
    const store = createEditorStore(makeDocument([shapeNode('a', 10, 0)]));
    store.getState().select('a');
    alignSelection(store, 'left');
    expect(xOf(store, 'a')).toBe(10);
    expect(store.getState().past.length).toBe(0);
  });

  it('commits exactly one history entry per align call', () => {
    const store = createEditorStore(makeDocument([shapeNode('a', 10, 0), shapeNode('b', 50, 0)]));
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    alignSelection(store, 'left');
    expect(store.getState().past.length).toBe(1);
  });
});

describe('distributeSelection', () => {
  it('equalizes gaps between bbox edges, keeping first/last fixed', () => {
    // 20-wide boxes at x=0, x=50, x=200 (centers) -> bbox edges: [-10,10], [40,60], [190,210]
    const store = createEditorStore(makeDocument([shapeNode('a', 0, 0), shapeNode('b', 50, 0), shapeNode('c', 200, 0)]));
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    store.getState().select('c', 'toggle');
    distributeSelection(store, 'horizontal');

    expect(xOf(store, 'a')).toBeCloseTo(0);
    expect(xOf(store, 'c')).toBeCloseTo(200);
    // total span edge-to-edge = 210 - (-10) = 220; total box size = 60; gap = (220-60)/2 = 80
    // b's target min = firstEdge(-10) + size(20) + gap(80) = 90 -> center x = 100
    expect(xOf(store, 'b')).toBeCloseTo(100);
  });

  it('is a no-op below 3 selected nodes', () => {
    const store = createEditorStore(makeDocument([shapeNode('a', 0, 0), shapeNode('b', 50, 0)]));
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    distributeSelection(store, 'horizontal');
    expect(store.getState().past.length).toBe(0);
  });
});
