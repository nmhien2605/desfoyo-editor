import { describe, expect, it } from 'vitest';
import { backdropRect, fitCamera } from '../stage';
import { createEditorStore } from '../../core/store';
import { DocumentSchema } from '../../schema';

const stage = { backdropUrl: 'x.png', pageCenter: { x: 0.5, y: 0.4 }, pageBox: { width: 0.5, height: 0.5 } };

describe('backdropRect', () => {
  it('fits the page into pageBox and centres it at pageCenter (web TextureEditor formula)', () => {
    // 1000×1200 image, page 300×300: k = min(1000*0.5/300, 1200*0.5/300) = 5/3.
    const rect = backdropRect({ width: 300, height: 300 }, { width: 1000, height: 1200 }, stage);
    expect(rect.width).toBeCloseTo(600);
    expect(rect.height).toBeCloseTo(720);
    // Page centre (150,150) sits at 0.5×600, 0.4×720 of the backdrop.
    expect(rect.x + 0.5 * rect.width).toBeCloseTo(150);
    expect(rect.y + 0.4 * rect.height).toBeCloseTo(150);
  });

  it('depends only on the image aspect, not its pixel size', () => {
    const a = backdropRect({ width: 200, height: 100 }, { width: 800, height: 600 }, stage);
    const b = backdropRect({ width: 200, height: 100 }, { width: 1600, height: 1200 }, stage);
    expect(b).toEqual(a);
  });
});

describe('fitCamera', () => {
  it('contains the rect and centres it in the canvas', () => {
    const cam = fitCamera({ width: 400, height: 400 }, { x: -50, y: -100, width: 200, height: 100 });
    expect(cam.zoom).toBe(2);
    // Rect corners map to (0,100) and (400,300).
    expect(-50 * cam.zoom + cam.panX).toBe(0);
    expect(-100 * cam.zoom + cam.panY).toBe(100);
    expect(150 * cam.zoom + cam.panX).toBe(400);
    expect(0 * cam.zoom + cam.panY).toBe(300);
  });
});

describe('store stage state', () => {
  const doc = DocumentSchema.parse({
    version: 1,
    id: 'd',
    meta: { title: 't', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'p', size: { width: 100, height: 100 }, background: { type: 'color', value: '#fff' }, children: [] }],
    assets: {},
  });

  it('setStageFit jumps to the fit and setCamera clamps zoom to [fit, fit × maxZoom]', () => {
    const store = createEditorStore(doc);
    store.getState().setStage({ ...stage, maxZoom: 3 });
    store.getState().setStageFit({ zoom: 0.5, panX: 10, panY: 20 });
    expect(store.getState().camera).toEqual({ zoom: 0.5, panX: 10, panY: 20 });
    store.getState().setCamera({ zoom: 0.1 });
    expect(store.getState().camera.zoom).toBe(0.5);
    store.getState().setCamera({ zoom: 100 });
    expect(store.getState().camera.zoom).toBe(1.5);
  });

  it('setStage ignores a structurally equal object and clears the fit when removed', () => {
    const store = createEditorStore(doc);
    store.getState().setStage(stage);
    store.getState().setStageFit({ zoom: 1, panX: 0, panY: 0 });
    const before = store.getState();
    store.getState().setStage({ ...stage });
    expect(store.getState()).toBe(before);
    store.getState().setStage(null);
    expect(store.getState().stageFit).toBeNull();
  });
});
