// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import { createEditorStore } from '../../core/store';
import { DocumentSchema } from '../../schema';
import { fitCamera } from '../stage';
import {
  attachStageGestures,
  resetStageView,
  setStageZoom,
  stageZoomLevel,
  stepStageZoom,
  watchStageZoom,
} from '../interactions/stageGestures';
import { createStageLayers } from '../stageLayers';

vi.mock('../renderers/imageRenderer', () => ({ acquireImage: () => new Promise(() => {}), releaseImage: () => {} }));

const stage = { backdropUrl: 'x.png', pageCenter: { x: 0.5, y: 0.5 }, pageBox: { width: 0.5, height: 0.5 } };
const doc = DocumentSchema.parse({
  version: 1,
  id: 'd',
  meta: { title: 't', createdAt: 0, updatedAt: 0 },
  pages: [{ id: 'p', name: 'p', size: { width: 100, height: 100 }, background: { type: 'color', value: '#fff' }, children: [] }],
  assets: {},
});

// 400×400 canvas showing a 200×200 backdrop around the 100×100 page: fit zoom 2.
function fitted(extra: Partial<typeof stage> & { minZoom?: number; maxZoom?: number } = {}) {
  const store = createEditorStore(doc);
  const backdrop = { x: -50, y: -50, width: 200, height: 200 };
  const canvas = { width: 400, height: 400 };
  store.getState().setStage({ ...stage, ...extra });
  store.getState().setStageFit(fitCamera(canvas, backdrop), { canvas, backdrop });
  return store;
}

describe('stage zoom level', () => {
  it('is relative to the fit and set/get round-trips, zooming around the view centre', () => {
    const store = fitted();
    expect(stageZoomLevel(store.getState())).toBe(1);
    const centreWorld = (c = store.getState().camera) => ({ x: (200 - c.panX) / c.zoom, y: (200 - c.panY) / c.zoom });
    const before = centreWorld();
    setStageZoom(store, 2);
    expect(stageZoomLevel(store.getState())).toBe(2);
    expect(store.getState().camera.zoom).toBe(4);
    expect(centreWorld()).toEqual(before);
  });

  it('clamps to [0.5, 4] by default and to minZoom/maxZoom when set', () => {
    const store = fitted();
    setStageZoom(store, 10);
    expect(stageZoomLevel(store.getState())).toBe(4);
    setStageZoom(store, 0.1);
    expect(stageZoomLevel(store.getState())).toBe(0.5);
    const custom = fitted({ minZoom: 1, maxZoom: 2 });
    setStageZoom(custom, 0.1);
    expect(stageZoomLevel(custom.getState())).toBe(1);
    setStageZoom(custom, 3);
    expect(stageZoomLevel(custom.getState())).toBe(2);
  });

  it('steps in/out through the step list and stops at the range ends', () => {
    const store = fitted();
    const levels: number[] = [];
    for (let i = 0; i < 8; i++) {
      stepStageZoom(store, 1);
      levels.push(stageZoomLevel(store.getState()));
    }
    expect(levels).toEqual([1.25, 1.5, 2, 3, 4, 4, 4, 4]);
    setStageZoom(store, 1.1); // off-step: out goes to the step below
    stepStageZoom(store, -1);
    expect(stageZoomLevel(store.getState())).toBe(1);
    stepStageZoom(store, -1);
    stepStageZoom(store, -1);
    stepStageZoom(store, -1);
    expect(stageZoomLevel(store.getState())).toBe(0.5);
  });

  it('is a no-op outside stage mode', () => {
    const store = createEditorStore(doc);
    const camera = store.getState().camera;
    setStageZoom(store, 2);
    stepStageZoom(store, 1);
    expect(store.getState().camera).toBe(camera);
    expect(stageZoomLevel(store.getState())).toBe(1);
  });

  it('below fit the backdrop sits centred in the canvas (pan clamp)', () => {
    const store = fitted();
    setStageZoom(store, 0.5);
    store.getState().setCamera({ panX: 1000, panY: -1000 });
    const { zoom, panX, panY } = store.getState().camera;
    // Backdrop is 200 × 1 = 200px wide in a 400px canvas: centred → its left edge at 100.
    expect(zoom).toBe(1);
    expect(-50 * zoom + panX).toBe(100);
    expect(-50 * zoom + panY).toBe(100);
  });

  it('keeps a below-fit zoom when only the canvas resizes', () => {
    const store = fitted();
    setStageZoom(store, 0.5);
    const backdrop = { x: -50, y: -50, width: 200, height: 200 };
    const canvas = { width: 400, height: 300 };
    store.getState().setStageFit(fitCamera(canvas, backdrop), { canvas, backdrop });
    expect(store.getState().camera.zoom).toBe(1); // fit is now 1.5, level 2/3
  });
});

describe('watchStageZoom (EditorProps.onZoomChange)', () => {
  it('fires on the first fit, zoom calls, resetView, gestures and resize refit — not on pan', () => {
    const store = createEditorStore(doc);
    const onZoom = vi.fn();
    const stop = watchStageZoom(store, onZoom);
    const backdrop = { x: -50, y: -50, width: 200, height: 200 };
    const canvas = { width: 400, height: 400 };
    store.getState().setStage(stage);
    store.getState().setStageFit(fitCamera(canvas, backdrop), { canvas, backdrop });
    expect(onZoom).toHaveBeenLastCalledWith(1);

    stepStageZoom(store, 1);
    expect(onZoom).toHaveBeenLastCalledWith(1.25);
    setStageZoom(store, 2);
    expect(onZoom).toHaveBeenLastCalledWith(2);

    onZoom.mockClear();
    store.getState().setCamera({ panX: store.getState().camera.panX - 10 });
    expect(onZoom).not.toHaveBeenCalled();

    // Resize keeps the zoom (4) but the fit changes (2 → 1.5): level 4 / 1.5.
    const smaller = { width: 400, height: 300 };
    store.getState().setStageFit(fitCamera(smaller, backdrop), { canvas: smaller, backdrop });
    expect(onZoom.mock.lastCall?.[0]).toBeCloseTo(4 / 1.5);

    resetStageView(store);
    expect(onZoom).toHaveBeenLastCalledWith(1);

    const area = document.createElement('div');
    document.body.appendChild(area);
    const detach = attachStageGestures(area, store);
    area.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, clientX: 200, clientY: 150, cancelable: true }));
    expect(onZoom.mock.lastCall?.[0]).toBeCloseTo(Math.exp(0.25));
    detach();
    stop();
    area.remove();
  });
});

describe('pasteboard', () => {
  it('masks page content to the page rect unless pasteboard is on', () => {
    const world = new Container();
    const pageContainer = new Container();
    const layers = createStageLayers(world, pageContainer, () => {});
    const clip = pageContainer.parent!;
    const page = doc.pages[0];

    layers.sync(stage, page);
    expect(clip.mask).toBeTruthy();
    const mask = clip.mask as Container;
    expect(mask.visible).toBe(true);

    layers.sync({ ...stage, pasteboard: true }, page);
    expect(clip.mask).toBeFalsy();
    // The unused mask graphic must not draw its white rect over the content.
    expect(mask.visible).toBe(false);
    // Content still above the backdrop and page fill.
    expect(world.children.indexOf(clip)).toBe(2);

    layers.sync(null, page);
    expect(clip.mask).toBeFalsy();
    layers.destroy();
  });
});
