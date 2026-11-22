// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import 'pixi.js/events';
import { Container, EventBoundary, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { attachDrag, setLockedInteraction } from '../drag';
import { createEditorStore } from '../../../core/store';
import type { Document, ShapeNode } from '../../../schema';

function shape(id: string, x: number, locked = false): ShapeNode {
  return {
    id,
    type: 'shape',
    transform: { x, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0, originY: 0 },
    size: { width: 100, height: 100 },
    opacity: 1,
    visible: true,
    locked,
    shape: 'rect',
    fill: { type: 'solid', color: '#000000' },
  };
}

function setup(nodes: ShapeNode[]) {
  const doc: Document = {
    version: 1,
    id: 'd',
    meta: { title: 'T', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'P', size: { width: 400, height: 400 }, background: { type: 'color', value: '#fff' }, children: nodes }],
    assets: {},
  };
  const store = createEditorStore(doc);
  const stage = new Container();
  stage.eventMode = 'static';
  stage.hitArea = new Rectangle(0, 0, 400, 400); // like CanvasHost: empty canvas hits the stage
  const page = new Container();
  stage.addChild(page);
  const objs = nodes.map((node) => {
    const obj = new Graphics().rect(0, 0, 100, 100).fill(0x000000);
    obj.label = node.id;
    obj.position.set(node.transform.x, 0);
    page.addChild(obj);
    attachDrag(obj, node, store, stage, page);
    return obj;
  });
  return { store, stage, objs };
}

// Minimal stand-in for what Pixi hands the listeners.
const ev = (x: number) =>
  ({ shiftKey: false, pointerId: 1, stopPropagation() {}, getLocalPosition: () => ({ x, y: 0 }) }) as unknown as FederatedPointerEvent;

describe('locked nodes on the canvas', () => {
  it('a locked node is not hit-tested, so the tap falls through to the node under it', () => {
    const { stage, objs } = setup([shape('under', 0), shape('top', 0, true)]);
    const boundary = new EventBoundary(stage);
    expect(boundary.hitTest(50, 50)?.label).toBe('under');
    setLockedInteraction(objs[1], false);
    expect(boundary.hitTest(50, 50)?.label).toBe('top');
    setLockedInteraction(objs[0], true);
    setLockedInteraction(objs[1], true);
    expect(boundary.hitTest(50, 50)).toBe(stage);
  });

  it('dragging a multi-selection moves only the unlocked members', () => {
    const { store, stage, objs } = setup([shape('a', 0), shape('b', 200, true)]);
    store.getState().select('a');
    store.getState().select('b', 'toggle');
    objs[0].emit('pointerdown', ev(10));
    stage.emit('pointermove', ev(40));
    stage.emit('pointerup', ev(40));
    const [a, b] = store.getState().document.pages[0].children;
    expect(a.transform.x).toBe(30);
    expect(b.transform.x).toBe(200);
  });
});
