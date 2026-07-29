import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../store';
import { computeSelectionBounds, applyGroupRotate } from '../../render/interactions/groupTransformMath';
import type { Document, Node, Page, ShapeNode } from '../../schema';

function shapeNode(id: string, x = 0, y = 0, rotation = 0): ShapeNode {
  return {
    id,
    type: 'shape',
    transform: { x, y, scaleX: 1, scaleY: 1, rotation, originX: 0.5, originY: 0.5 },
    size: { width: 20, height: 20 },
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

const PAGE_ID = 'page-1';

function extraPage(id: string, nodes: Node[] = []): Page {
  return { id, name: id, size: { width: 400, height: 400 }, background: { type: 'color', value: '#eeeeee' }, children: nodes };
}

describe('multi-page', () => {
  it('AddPage grows document.pages and the new page is addressable', () => {
    const store = createEditorStore(makeDocument([]));
    store.getState().dispatch({ type: 'AddPage', page: extraPage('page-2') });
    expect(store.getState().document.pages).toHaveLength(2);
    expect(store.getState().document.pages[1].id).toBe('page-2');
  });

  it('RemovePage on the last remaining page no-ops', () => {
    const store = createEditorStore(makeDocument([]));
    store.getState().dispatch({ type: 'RemovePage', pageId: PAGE_ID });
    expect(store.getState().document.pages).toHaveLength(1);
    expect(store.getState().document.pages[0].id).toBe(PAGE_ID);
  });

  it('RemovePage on the active page reassigns activePageId to a remaining page', () => {
    const store = createEditorStore(makeDocument([]));
    store.getState().dispatch({ type: 'AddPage', page: extraPage('page-2') });
    store.getState().setActivePage(PAGE_ID);
    store.getState().dispatch({ type: 'RemovePage', pageId: PAGE_ID });
    expect(store.getState().document.pages).toHaveLength(1);
    expect(store.getState().activePageId).toBe('page-2');
  });

  it('DuplicatePage produces a page with a fresh id and independently-editable (cloned) children', () => {
    const store = createEditorStore(makeDocument([]));
    store.getState().dispatch({ type: 'AddPage', page: extraPage('page-2', [shapeNode('n1', 0, 0)]) });
    store.getState().dispatch({ type: 'DuplicatePage', pageId: 'page-2', newPageId: 'page-3' });

    const pages = store.getState().document.pages;
    expect(pages).toHaveLength(3);
    const original = pages.find((p) => p.id === 'page-2')!;
    const clone = pages.find((p) => p.id === 'page-3')!;
    expect(clone.children[0].id).not.toBe(original.children[0].id);

    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'page-3', nodeId: clone.children[0].id, patch: { x: 999 } });
    const originalAfter = store.getState().document.pages.find((p) => p.id === 'page-2')!;
    expect(originalAfter.children[0].transform.x).toBe(0);
  });

  it('ReorderPage moves a page within document.pages', () => {
    const store = createEditorStore(makeDocument([]));
    store.getState().dispatch({ type: 'AddPage', page: extraPage('page-2') });
    store.getState().dispatch({ type: 'ReorderPage', pageId: PAGE_ID, to: 'up' });
    expect(store.getState().document.pages.map((p) => p.id)).toEqual(['page-2', PAGE_ID]);
  });
});

describe('history: 20 operations then undo all', () => {
  it('returns to exactly the original document (DoD)', () => {
    const original = makeDocument([shapeNode('a', 0, 0), shapeNode('b', 50, 50), shapeNode('c', 100, 100)]);
    const originalSnapshot = JSON.parse(JSON.stringify(original));
    const store = createEditorStore(original);

    for (let i = 0; i < 20; i++) {
      const ids = store.getState().document.pages[0].children.map((n) => n.id);
      const op = i % 4;
      if (op === 0) {
        store.getState().dispatch({ type: 'AddNode', pageId: PAGE_ID, node: shapeNode(`extra-${i}`, i, i) });
      } else if (op === 1) {
        store.getState().dispatch({
          type: 'UpdateTransform',
          pageId: PAGE_ID,
          nodeId: ids[0],
          patch: { x: i * 3, rotation: i * 0.1 },
        });
      } else if (op === 2 && ids.length > 1) {
        store.getState().dispatch({ type: 'Reorder', pageId: PAGE_ID, nodeId: ids[ids.length - 1], to: 'up' });
      } else if (ids.length > 1) {
        store.getState().dispatch({ type: 'RemoveNode', pageId: PAGE_ID, nodeId: ids[ids.length - 1] });
      } else {
        store.getState().dispatch({ type: 'AddNode', pageId: PAGE_ID, node: shapeNode(`filler-${i}`, i, i) });
      }
    }

    expect(store.getState().past.length).toBeGreaterThan(0);
    const entryCount = store.getState().past.length;
    for (let i = 0; i < entryCount; i++) store.getState().undo();

    expect(store.getState().document).toEqual(originalSnapshot);
    expect(store.getState().past.length).toBe(0);
  });
});

describe('gesture coalescing', () => {
  it('N dispatches between beginGesture/endGesture commit exactly one history entry', () => {
    const doc = makeDocument([shapeNode('a', 0, 0)]);
    const store = createEditorStore(doc);
    const before = store.getState().document;

    store.getState().beginGesture('test-drag');
    for (let i = 1; i <= 5; i++) {
      store.getState().dispatch({ type: 'UpdateTransform', pageId: PAGE_ID, nodeId: 'a', patch: { x: i * 10 } });
    }
    store.getState().endGesture();

    expect(store.getState().past.length).toBe(1);
    expect(store.getState().document.pages[0].children[0].transform.x).toBe(50);

    store.getState().undo();
    expect(store.getState().document).toEqual(before);
  });

  it('a no-op gesture (begin/end with no dispatch) commits nothing', () => {
    const doc = makeDocument([shapeNode('a')]);
    const store = createEditorStore(doc);
    store.getState().beginGesture('noop');
    store.getState().endGesture();
    expect(store.getState().past.length).toBe(0);
  });
});

describe('group 10 objects, rotate, ungroup (DoD)', () => {
  it('positions remain correct — matches direct rotation around the shared pivot without ever grouping', () => {
    const nodes = Array.from({ length: 10 }, (_, i) =>
      shapeNode(`n${i}`, i * 15 - 40, (i % 3) * 25, i * 0.05),
    );
    const doc = makeDocument(nodes);
    const store = createEditorStore(doc);

    const bounds = computeSelectionBounds(nodes);
    const rotationDelta = 0.8;

    store.getState().dispatch({
      type: 'GroupNodes',
      pageId: PAGE_ID,
      nodeIds: nodes.map((n) => n.id),
      groupId: 'group-1',
    });
    store.getState().dispatch({
      type: 'UpdateTransform',
      pageId: PAGE_ID,
      nodeId: 'group-1',
      patch: { rotation: rotationDelta },
    });
    store.getState().dispatch({ type: 'UngroupNode', pageId: PAGE_ID, groupId: 'group-1' });

    const finalChildren = store.getState().document.pages[0].children;
    expect(finalChildren).toHaveLength(10);

    const expected = applyGroupRotate(nodes, bounds.pivot, rotationDelta);
    for (const exp of expected) {
      const actual = finalChildren.find((n) => n.id === exp.nodeId);
      expect(actual).toBeDefined();
      expect(actual!.transform.x).toBeCloseTo(exp.transform.x, 5);
      expect(actual!.transform.y).toBeCloseTo(exp.transform.y, 5);
      expect(actual!.transform.rotation).toBeCloseTo(exp.transform.rotation!, 5);
    }
  });

  it('is undoable back through group -> rotate -> ungroup to the exact original document', () => {
    const nodes = Array.from({ length: 10 }, (_, i) => shapeNode(`n${i}`, i * 10, i * 5));
    const doc = makeDocument(nodes);
    const originalSnapshot = JSON.parse(JSON.stringify(doc));
    const store = createEditorStore(doc);

    store.getState().dispatch({
      type: 'GroupNodes',
      pageId: PAGE_ID,
      nodeIds: nodes.map((n) => n.id),
      groupId: 'group-1',
    });
    store.getState().dispatch({
      type: 'UpdateTransform',
      pageId: PAGE_ID,
      nodeId: 'group-1',
      patch: { rotation: 1.2 },
    });
    store.getState().dispatch({ type: 'UngroupNode', pageId: PAGE_ID, groupId: 'group-1' });

    expect(store.getState().past.length).toBe(3);
    store.getState().undo();
    store.getState().undo();
    store.getState().undo();

    expect(store.getState().document).toEqual(originalSnapshot);
  });
});
