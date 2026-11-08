// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { endOwnGesture, onPointerCancel, startPointerGesture } from '../pointerGesture';
import { createEditorStore } from '../../../core/store';
import type { Document, Node } from '../../../schema';

const shape = (id: string): Node =>
  ({
    id,
    type: 'shape',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 20, height: 20 },
    opacity: 1,
    visible: true,
    locked: false,
    shape: 'rect',
    fill: { type: 'solid', color: '#000' },
  }) as unknown as Node;

const makeDoc = (): Document =>
  ({
    version: 1,
    id: 'd',
    meta: { title: 't', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'p', size: { width: 800, height: 600 }, background: { type: 'color', value: '#fff' }, children: [shape('a')] }],
    assets: {},
  }) as unknown as Document;

const move = (store: ReturnType<typeof createEditorStore>) => (e: PointerEvent) =>
  store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: e.clientX } });
const xOf = (store: ReturnType<typeof createEditorStore>) => store.getState().document.pages[0].children[0].transform.x;

describe('startPointerGesture — cancel', () => {
  it('pointercancel of the starting pointer ends the gesture, commits one entry, detaches moves', () => {
    const store = createEditorStore(makeDoc());
    startPointerGesture(store, 'resize:a', move(store), 7);
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: 10 }));
    // Another finger neither drives nor ends it.
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 8, clientX: 99 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 8 }));
    expect(store.getState().activeGestureId).toBe('resize:a');
    expect(xOf(store)).toBe(10);

    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }));
    expect(store.getState().activeGestureId).toBeNull();
    expect(store.getState().past).toHaveLength(1);

    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: 50 }));
    expect(xOf(store)).toBe(10);
    // History works again: a later edit is its own entry, undo restores.
    store.getState().undo();
    expect(xOf(store)).toBe(0);
  });

  it('window blur ends it too', () => {
    const store = createEditorStore(makeDoc());
    startPointerGesture(store, 'rotate:a', move(store), 1);
    window.dispatchEvent(new Event('blur'));
    expect(store.getState().activeGestureId).toBeNull();
  });

  it('a later pinch cancelGesture cannot revert edits made after a cancelled handle drag', () => {
    const store = createEditorStore(makeDoc());
    startPointerGesture(store, 'resize:a', move(store), 1);
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 10 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 30 } });
    store.getState().cancelGesture();
    expect(xOf(store)).toBe(30);
    expect(store.getState().past).toHaveLength(2);
  });
});

describe('endOwnGesture', () => {
  it('ends only the named gesture', () => {
    const store = createEditorStore(makeDoc());
    store.getState().beginGesture('resize:a');
    endOwnGesture(store, 'opacity');
    expect(store.getState().activeGestureId).toBe('resize:a');
    endOwnGesture(store, 'resize:a');
    expect(store.getState().activeGestureId).toBeNull();
  });
});

describe('onPointerCancel', () => {
  it('fires once for its pointer, not after detach', () => {
    let calls = 0;
    onPointerCancel(3, () => calls++);
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 4 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 3 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 3 }));
    expect(calls).toBe(1);
    const detach = onPointerCancel(3, () => calls++);
    detach();
    window.dispatchEvent(new Event('blur'));
    expect(calls).toBe(1);
  });
});
