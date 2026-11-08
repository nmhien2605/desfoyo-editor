// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, type Graphics } from 'pixi.js';
import { SceneReconciler } from '../SceneReconciler';
import { applyTransform } from '../applyTransform';
import { svgRenderer } from '../renderers/svgRenderer';
import { loadsSettled } from '../pendingLoads';
import { createEditorStore } from '../../core/store';
import type { Document, ShapeNode, SvgNode } from '../../schema';

const transform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 };

const shape: ShapeNode = {
  id: 'shape-1',
  type: 'shape',
  transform,
  size: { width: 80, height: 40 },
  opacity: 1,
  visible: true,
  locked: false,
  shape: 'rect',
  fill: { type: 'solid', color: '#ff0000' },
  effects: [{ type: 'shadow', color: '#000000', blur: 4, offset: [2, 2], alpha: 0.5 }],
};

const svgNode: SvgNode = {
  id: 'svg-1',
  type: 'svg',
  transform,
  size: { width: 100, height: 100 },
  opacity: 1,
  visible: true,
  locked: false,
  assetId: 'a',
};

function makeDoc(children: Document['pages'][number]['children'], assets: Document['assets'] = {}): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'T', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'P', size: { width: 400, height: 400 }, background: { type: 'color', value: '#fff' }, children }],
    assets,
  };
}

const svgOf = (w: number) => `<svg xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="10" fill="#f00"/></svg>`;

afterEach(() => vi.unstubAllGlobals());

describe('UpdateTransform fast path', () => {
  it('moves the object without redrawing geometry or rebuilding filters', () => {
    const store = createEditorStore(makeDoc([shape]));
    const reconciler = new SceneReconciler(new Container());
    reconciler.mount(store.getState().document.pages[0], store.getState().document);
    const obj = reconciler.getDisplayObject('shape-1') as Graphics;
    const clear = vi.spyOn(obj, 'clear');
    const filters = obj.filters;

    for (let i = 1; i <= 5; i++) {
      const cmd = { type: 'UpdateTransform', pageId: 'p', nodeId: 'shape-1', patch: { x: i * 10, y: i, rotation: 0.5, scaleX: 2 } } as const;
      store.getState().dispatch(cmd);
      reconciler.apply(cmd, store.getState().document);
    }

    expect(clear).not.toHaveBeenCalled();
    expect(obj.position.x).toBe(50);
    expect(obj.position.y).toBe(5);
    expect(obj.rotation).toBe(0.5);
    expect(obj.scale.x).toBe(2);
    expect(obj.pivot.x).toBe(40);
    expect(obj.filters).toBe(filters);
  });

  it('still redraws on UpdateProps', () => {
    const store = createEditorStore(makeDoc([shape]));
    const reconciler = new SceneReconciler(new Container());
    reconciler.mount(store.getState().document.pages[0], store.getState().document);
    const obj = reconciler.getDisplayObject('shape-1') as Graphics;
    const clear = vi.spyOn(obj, 'clear');
    const cmd = { type: 'UpdateProps', pageId: 'p', nodeId: 'shape-1', patch: { size: { width: 10, height: 10 } } } as const;
    store.getState().dispatch(cmd);
    reconciler.apply(cmd, store.getState().document);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});

describe('applyTransform filter reuse', () => {
  it('reuses filters while effects are unchanged and destroys replaced ones', () => {
    const obj = new Container();
    applyTransform(obj, shape);
    const first = obj.filters as unknown as { destroy(): void }[];
    expect(first).toHaveLength(1);
    const destroy = vi.spyOn(first[0], 'destroy');

    applyTransform(obj, { ...shape, transform: { ...transform, x: 99 } });
    expect(obj.filters).toBe(first);

    applyTransform(obj, { ...shape, effects: [{ type: 'blur', amount: 3 }] });
    expect(obj.filters).not.toBe(first);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

describe('svgRenderer', () => {
  function deferredFetch() {
    const pending = new Map<string, (text: string) => void>();
    let calls = 0;
    vi.stubGlobal('fetch', (src: string) => {
      calls++;
      return new Promise((resolve) => pending.set(src, (text) => resolve({ text: async () => text })));
    });
    return { pending, calls: () => calls };
  }

  it('applies only the latest build when async loads finish out of order', async () => {
    const { pending } = deferredFetch();
    const doc = makeDoc([], { a: { type: 'svg', dataUri: 'data:a' }, b: { type: 'svg', dataUri: 'data:b' } });
    const obj = svgRenderer.create(svgNode, doc);
    svgRenderer.update(obj, { ...svgNode, assetId: 'b' }, doc);

    pending.get('data:b')!(svgOf(50));
    await Promise.resolve();
    pending.get('data:a')!(svgOf(20));
    await loadsSettled();

    expect(obj.getLocalBounds().width).toBe(50);
  });

  it('does not decode again when the asset is unchanged, and a late build uses the latest transform', async () => {
    const { pending, calls } = deferredFetch();
    const doc = makeDoc([], { a: { type: 'svg', dataUri: 'data:a' } });
    const obj = svgRenderer.create(svgNode, doc);
    svgRenderer.update(obj, { ...svgNode, opacity: 0.5 }, doc);
    svgRenderer.updateTransform(obj, { ...svgNode, transform: { ...transform, x: 70, scaleX: 2 } });
    expect(calls()).toBe(1);

    pending.get('data:a')!(svgOf(50));
    await loadsSettled();

    expect(obj.position.x).toBe(70);
    // size 100 / drawn width 50, times transform.scaleX 2.
    expect(obj.scale.x).toBe(4);
  });
});

describe('store selection identity', () => {
  it('keeps the same selection Set unless a selected node is removed', () => {
    const store = createEditorStore(makeDoc([shape, { ...shape, id: 'shape-2' }]));
    store.getState().select('shape-1');
    const selected = store.getState().selectedNodeIds;

    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'shape-1', patch: { x: 5 } });
    store.getState().dispatch({ type: 'RemoveNode', pageId: 'p', nodeId: 'shape-2' });
    expect(store.getState().selectedNodeIds).toBe(selected);

    store.getState().dispatch({ type: 'RemoveNode', pageId: 'p', nodeId: 'shape-1' });
    expect(store.getState().selectedNodeIds).not.toBe(selected);
    expect(store.getState().selectedNodeIds.size).toBe(0);
  });
});
