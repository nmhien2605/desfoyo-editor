import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditorStore } from '../../core/store';
import { selectionRect, watchSelectionRect } from '../selectionRect';
import type { Document, ShapeNode } from '../../schema';

const shape = (id: string, x: number, y: number, rotation = 0): ShapeNode => ({
  id,
  type: 'shape',
  transform: { x, y, scaleX: 1, scaleY: 1, rotation, originX: 0.5, originY: 0.5 },
  size: { width: 100, height: 50 },
  opacity: 1,
  visible: true,
  locked: false,
  shape: 'rect',
  fill: { type: 'solid', color: '#000' },
});

const doc = (): Document => ({
  version: 1,
  id: 'd',
  meta: { title: 'T', createdAt: 0, updatedAt: 0 },
  pages: [
    { id: 'p', name: 'P', size: { width: 400, height: 400 }, background: { type: 'color', value: '#fff' }, children: [shape('a', 100, 100), shape('b', 300, 200, Math.PI / 2)] },
    { id: 'q', name: 'Q', size: { width: 400, height: 400 }, background: { type: 'color', value: '#fff' }, children: [] },
  ],
  assets: {},
});

const camera = { zoom: 2, panX: 10, panY: 20 };

describe('selectionRect', () => {
  it('null when nothing is selected or the node is not on the current page', () => {
    const store = createEditorStore(doc());
    expect(selectionRect(store.getState())).toBeNull();
    store.setState({ selectedNodeIds: new Set(['a']), activePageId: 'q' });
    expect(selectionRect(store.getState())).toBeNull();
  });

  it('converts the single-node world box through the camera, with rotation in degrees', () => {
    const store = createEditorStore(doc());
    store.setState({ selectedNodeIds: new Set(['a']), camera });
    expect(selectionRect(store.getState())).toEqual({ x: 50 * 2 + 10, y: 75 * 2 + 20, width: 200, height: 100, rotation: 0 });
    store.setState({ selectedNodeIds: new Set(['b']) });
    const r = selectionRect(store.getState())!;
    expect(r.rotation).toBeCloseTo(90);
    // Rotated 90°: the axis-aligned box swaps width/height.
    expect(r.x).toBeCloseTo(275 * 2 + 10);
    expect(r.width).toBeCloseTo(100);
    expect(r.height).toBeCloseTo(200);
  });

  it('multi-select: union box, rotation 0, locked nodes included', () => {
    const d = doc();
    d.pages[0].children[1] = { ...d.pages[0].children[1], locked: true };
    const store = createEditorStore(d);
    store.setState({ selectedNodeIds: new Set(['a', 'b']), camera: { zoom: 1, panX: 0, panY: 0 } });
    const r = selectionRect(store.getState())!;
    expect(r.x).toBeCloseTo(50);
    expect(r.y).toBeCloseTo(75);
    expect(r.x + r.width).toBeCloseTo(325);
    expect(r.y + r.height).toBeCloseTo(250);
    expect(r.rotation).toBe(0);
  });
});

describe('watchSelectionRect', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fires once per frame, never twice with an identical rect, and null on deselect', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const run = () => frames.splice(0).forEach((cb) => cb(0));

    const store = createEditorStore(doc());
    const onChange = vi.fn();
    const stop = watchSelectionRect(store, onChange);
    run();
    expect(onChange).not.toHaveBeenCalled(); // nothing selected, already null

    store.getState().select('a');
    store.getState().setCamera({ panX: 5 });
    store.getState().setCamera({ panX: 6 });
    run();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ x: 56, y: 75, width: 100, height: 50, rotation: 0 });

    store.getState().setCamera({ panX: 6 }); // new camera object, same rect
    run();
    expect(onChange).toHaveBeenCalledTimes(1);

    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 110 } });
    run();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall![0].x).toBe(66);

    store.getState().select(null);
    run();
    expect(onChange).toHaveBeenLastCalledWith(null);
    stop();
  });
});
